import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../lib/jwt.js';

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

    const user = await db.select().from(users).where(eq(users.email, email)).get();
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
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
  });

  // POST /api/auth/refresh
  app.post('/api/auth/refresh', async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid input' });
    }

    const payload = await verifyToken(parsed.data.refreshToken);
    if (!payload) {
      return reply.status(401).send({ error: 'Invalid or expired refresh token' });
    }

    // Verify user still exists
    const user = await db.select().from(users).where(eq(users.id, payload.userId)).get();
    if (!user) {
      return reply.status(401).send({ error: 'User not found' });
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
