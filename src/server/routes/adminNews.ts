import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { desc, eq, sql, like } from 'drizzle-orm';
import { db } from '../db/index.js';
import { news } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

// ─── Schemas Zod ─────────────────────────────────────────────────────────────
const listNewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const createNewsSchema = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  publishedAt: z.coerce.date().optional(),
});

const updateNewsSchema = z.object({
  title: z.string().min(1).optional(),
  summary: z.string().optional(),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  publishedAt: z.coerce.date().optional(),
});

// ─── Admin guard helper ──────────────────────────────────────────────────────
function isAdmin(request: any): boolean {
  return request.user?.role === 'admin';
}

// ─── Routes ──────────────────────────────────────────────────────────────────
export async function adminNewsRoutes(app: FastifyInstance) {
  // All routes require auth + admin role
  app.addHook('preHandler', async (request, reply) => {
    await authMiddleware(request, reply);
    if (reply.sent) return;
    if (!isAdmin(request)) {
      return reply.status(403).send({ error: 'Admin access required' });
    }
  });

  // GET /api/admin/news — listar notícias com paginação e busca
  app.get('/api/admin/news', async (request, reply) => {
    const parsed = listNewsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid query params', details: parsed.error.flatten() });
    }

    const { page, limit, search } = parsed.data;
    const offset = (page - 1) * limit;

    try {
      const whereClause = search ? like(news.title, `%${search}%`) : undefined;

      const [allNews, countResult] = await Promise.all([
        db.select()
          .from(news)
          .where(whereClause)
          .orderBy(desc(news.publishedAt))
          .limit(limit)
          .offset(offset),
        db.select({ total: sql<number>`COUNT(*)` })
          .from(news)
          .where(whereClause),
      ]);

      const total = Number(countResult[0]?.total ?? 0);

      return reply.send({
        news: allNews,
        total,
        page,
        limit,
      });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch news' });
    }
  });

  // POST /api/admin/news — criar notícia
  app.post('/api/admin/news', async (request, reply) => {
    const parsed = createNewsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
    }

    try {
      const result = await db.insert(news)
        .values({
          title: parsed.data.title,
          summary: parsed.data.summary ?? '',
          sourceUrl: parsed.data.sourceUrl ?? '',
          publishedAt: parsed.data.publishedAt ?? new Date(),
        })
        .returning();

      return reply.status(201).send(result[0]);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to create news' });
    }
  });

  // PUT /api/admin/news/:id — atualizar notícia
  app.put('/api/admin/news/:id', async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid news id' });
    }

    const parsed = updateNewsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
    }

    if (Object.keys(parsed.data).length === 0) {
      return reply.status(400).send({ error: 'At least one field must be provided' });
    }

    try {
      const updateData: Record<string, unknown> = {};
      if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
      if (parsed.data.summary !== undefined) updateData.summary = parsed.data.summary;
      if (parsed.data.sourceUrl !== undefined) updateData.sourceUrl = parsed.data.sourceUrl;
      if (parsed.data.publishedAt !== undefined) updateData.publishedAt = parsed.data.publishedAt;

      const updated = await db.update(news)
        .set(updateData)
        .where(eq(news.id, params.data.id))
        .returning();

      if (updated.length === 0) {
        return reply.status(404).send({ error: 'News not found' });
      }

      return reply.send(updated[0]);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to update news' });
    }
  });

  // DELETE /api/admin/news/:id — deletar notícia (hard delete)
  app.delete('/api/admin/news/:id', async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid news id' });
    }

    try {
      const deleted = await db.delete(news)
        .where(eq(news.id, params.data.id))
        .returning();

      if (deleted.length === 0) {
        return reply.status(404).send({ error: 'News not found' });
      }

      return reply.status(204).send();
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete news' });
    }
  });
}
