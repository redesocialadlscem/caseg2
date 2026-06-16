import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Rate limiting de login (in-memory, janela deslizante) ───────────────────
// Suficiente para deploy single-instância. Em cluster, trocar por Redis.
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 min
const LOGIN_MAX_ATTEMPTS = 8;
const loginAttempts = new Map<string, number[]>();

function rateLimitKey(ip: string, email: string): string {
  return `${ip}:${email.toLowerCase()}`;
}

/** Retorna true se ainda está dentro do limite (pode tentar). */
function checkLoginRateLimit(key: string): boolean {
  const now = Date.now();
  const hits = (loginAttempts.get(key) || []).filter(t => now - t < LOGIN_WINDOW_MS);
  hits.push(now);
  loginAttempts.set(key, hits);
  return hits.length <= LOGIN_MAX_ATTEMPTS;
}

function resetLoginRateLimit(key: string): void {
  loginAttempts.delete(key);
}

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/register
  app.post('/api/auth/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid input', details: parsed.error.flatten() });
    }

    const { email, name, password } = parsed.data;

    // Check if user already exists
    const existing = await db.select().from(users).where(eq(users.email, email)).get();
    if (existing) {
      return reply.status(409).send({ error: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);

    const result = await db.insert(users).values({
      email,
      name,
      passwordHash,
      role: 'student',
    }).returning();

    const newUser = Array.isArray(result) ? result[0] : result;

    if (!newUser) {
      return reply.status(500).send({ error: 'Failed to create user' });
    }

    const accessToken = await signAccessToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role as 'student' | 'admin',
    });

    const refreshToken = await signRefreshToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role as 'student' | 'admin',
    });

    return reply.status(201).send({
      user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
      accessToken,
      refreshToken,
    });
  });

  // POST /api/auth/login
  app.post('/api/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid input', details: parsed.error.flatten() });
    }

    const { email, password } = parsed.data;

    const rlKey = rateLimitKey(request.ip, email);
    if (!checkLoginRateLimit(rlKey)) {
      return reply.status(429).send({
        error: 'Too many login attempts. Try again in a few minutes.',
      });
    }

    const user = await db.select().from(users).where(eq(users.email, email)).get();
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    if (!user.passwordHash) {
      // Conta criada via Google não tem senha local
      return reply.status(401).send({ error: 'Use o login com Google para esta conta.' });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return reply.status(403).send({ error: 'Account disabled' });
    }

    // Login bem-sucedido: zera o contador de tentativas
    resetLoginRateLimit(rlKey);

    const accessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'student' | 'admin',
    });

    const refreshToken = await signRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'student' | 'admin',
    });

    return reply.send({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken,
      refreshToken,
    });
  });

  // POST /api/auth/google
  app.post('/api/auth/google', async (request, reply) => {
    const schema = z.object({ credential: z.string().min(1) });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid input' });
    }

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: parsed.data.credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return reply.status(401).send({ error: 'Invalid Google token' });
      }

      let user = await db.select().from(users).where(eq(users.email, payload.email)).get();

      if (!user) {
        const result = await db.insert(users).values({
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
          passwordHash: '',
          role: 'student',
        }).returning();
        user = Array.isArray(result) ? result[0] : result;
      }

      if (!user) {
        return reply.status(500).send({ error: 'Failed to create/find user' });
      }

      const accessToken = await signAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role as 'student' | 'admin',
      });

      const refreshToken = await signRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role as 'student' | 'admin',
      });

      return reply.send({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken,
        refreshToken,
      });
    } catch (err) {
      console.error('Google OAuth error:', err);
      return reply.status(401).send({ error: 'Google authentication failed' });
    }
  });

  // POST /api/auth/refresh
  app.post('/api/auth/refresh', async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid input' });
    }

    const payload = await verifyRefreshToken(parsed.data.refreshToken);
    if (!payload) {
      return reply.status(401).send({ error: 'Invalid or expired refresh token' });
    }

    // Verify user still exists and is active
    const user = await db.select().from(users).where(eq(users.id, payload.userId)).get();
    if (!user) {
      return reply.status(401).send({ error: 'User not found' });
    }
    if (!user.isActive) {
      return reply.status(403).send({ error: 'Account disabled' });
    }

    const accessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'student' | 'admin',
    });

    const refreshToken = await signRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'student' | 'admin',
    });

    return reply.send({ accessToken, refreshToken });
  });
}
