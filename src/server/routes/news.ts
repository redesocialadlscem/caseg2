import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { news } from '../db/schema.js';

const listNewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

export async function newsRoutes(app: FastifyInstance) {
  app.get('/api/news', async (request, reply) => {
    const parsed = listNewsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid query params' });
    }

    const { page, limit } = parsed.data;
    const offset = (page - 1) * limit;

    try {
      const [items, countResult] = await Promise.all([
        db
          .select()
          .from(news)
          .orderBy(desc(news.publishedAt))
          .limit(limit)
          .offset(offset),
        db.select({ total: sql<number>`COUNT(*)` }).from(news),
      ]);

      const total = Number(countResult[0]?.total ?? 0);

      return reply.send({ news: items, total, page, limit });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch news' });
    }
  });
}
