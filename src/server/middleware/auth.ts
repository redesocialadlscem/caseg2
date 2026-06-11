import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../lib/jwt.js';

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);

  if (!payload) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }

  // Attach user to request for downstream handlers
  (request as any).user = payload;
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
