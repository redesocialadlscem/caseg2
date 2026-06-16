import { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import { verifyAccessToken } from '../lib/jwt.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  const payload = await verifyAccessToken(token);

  if (!payload) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }

  // Bloqueia usuários desativados (ou removidos) mesmo com token válido.
  const account = await db
    .select({ isActive: users.isActive, role: users.role })
    .from(users)
    .where(eq(users.id, payload.userId))
    .get();

  if (!account) {
    return reply.status(401).send({ error: 'User not found' });
  }
  if (!account.isActive) {
    return reply.status(403).send({ error: 'Account disabled' });
  }

  // Attach user to request for downstream handlers (role sempre da fonte da verdade)
  (request as any).user = { ...payload, role: account.role };
}

// Type augmentation for FastifyRequest
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: number;
      email: string;
      role: 'student' | 'admin';
    };
  }
}
