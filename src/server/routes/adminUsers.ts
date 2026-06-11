import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { desc, eq, sql, and, like } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

// ─── Schemas Zod ─────────────────────────────────────────────────────────────
const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['student', 'admin']).optional(),
  isActive: z.coerce.boolean().optional(),
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const updateRoleSchema = z.object({
  role: z.enum(['student', 'admin']),
});

const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

// ─── Admin guard helper ──────────────────────────────────────────────────────
function isAdmin(request: any): boolean {
  return request.user?.role === 'admin';
}

// ─── Routes ──────────────────────────────────────────────────────────────────
export async function adminUserRoutes(app: FastifyInstance) {
  // All routes require auth + admin role
  app.addHook('preHandler', async (request, reply) => {
    await authMiddleware(request, reply);
    if (reply.sent) return;
    if (!isAdmin(request)) {
      return reply.status(403).send({ error: 'Admin access required' });
    }
  });

  // GET /api/admin/users — listar usuários com paginação, busca e filtros
  app.get('/api/admin/users', async (request, reply) => {
    const parsed = listUsersQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid query params', details: parsed.error.flatten() });
    }

    const { page, limit, search, role, isActive } = parsed.data;
    const offset = (page - 1) * limit;

    try {
      const conditions = [];

      if (search) {
        conditions.push(
          sql`(${users.name} LIKE ${`%${search}%`} OR ${users.email} LIKE ${`%${search}%`})`
        );
      }

      if (role) {
        conditions.push(eq(users.role, role));
      }

      if (isActive !== undefined) {
        conditions.push(eq(users.isActive, isActive));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [allUsers, countResult] = await Promise.all([
        db.select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
        })
          .from(users)
          .where(whereClause)
          .orderBy(desc(users.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ total: sql<number>`COUNT(*)` })
          .from(users)
          .where(whereClause),
      ]);

      const total = Number(countResult[0]?.total ?? 0);

      return reply.send({
        users: allUsers,
        total,
        page,
        limit,
      });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch users' });
    }
  });

  // PUT /api/admin/users/:id/role — trocar role do usuário
  app.put('/api/admin/users/:id/role', async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid user id' });
    }

    const parsed = updateRoleSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
    }

    // Não permitir alterar próprio role
    if (request.user?.userId === params.data.id) {
      return reply.status(400).send({ error: 'Cannot change your own role' });
    }

    try {
      const updated = await db.update(users)
        .set({ role: parsed.data.role })
        .where(eq(users.id, params.data.id))
        .returning();

      if (updated.length === 0) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return reply.send({
        id: updated[0].id,
        name: updated[0].name,
        email: updated[0].email,
        role: updated[0].role,
      });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to update user role' });
    }
  });

  // PATCH /api/admin/users/:id/status — ativar/desativar usuário (soft delete)
  // NOTE: Schema precisa ter coluna isActive. Se não existir, retorna erro informativo.
  app.patch('/api/admin/users/:id/status', async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid user id' });
    }

    const parsed = updateStatusSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
    }

    // Não permitir desativar a si mesmo
    if (request.user?.userId === params.data.id) {
      return reply.status(400).send({ error: 'Cannot change your own status' });
    }

    try {
      // Verificar se usuário existe
      const user = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.id, params.data.id))
        .get();

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      const updated = await db.update(users)
        .set({ isActive: parsed.data.isActive })
        .where(eq(users.id, params.data.id))
        .returning();

      if (updated.length === 0) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return reply.send({ id: updated[0].id, isActive: updated[0].isActive });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to update user status' });
    }
  });
}
