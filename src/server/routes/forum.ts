import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { desc, eq, and, sql, asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  forumTopics,
  forumReplies,
  forumLikes,
  courses,
  progress,
  lessons,
  modules,
  users,
} from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isAdmin(role?: string) {
  return role === 'admin';
}

// ─── Schemas ─────────────────────────────────────────────────────────────────
const createTopicSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(10000),
});

const createReplySchema = z.object({
  content: z.string().min(1).max(5000),
  parentReplyId: z.number().int().positive().optional(),
});

const toggleLikeSchema = z.object({
  targetType: z.enum(['topic', 'reply']),
  targetId: z.number().int().positive(),
});

// ─── Plugin ──────────────────────────────────────────────────────────────────
export async function forumRoutes(app: FastifyInstance) {
  // Todas as rotas do fórum exigem autenticação
  app.addHook('preHandler', authMiddleware);

  // GET /api/forum/courses — lista cursos onde o usuário tem acesso (ativo ou concluído)
  app.get('/api/forum/courses', async (request, reply) => {
    const userId = request.user!.userId;
    const userRole = request.user!.role;

    try {
      // Admin vê todos os cursos ativos
      if (isAdmin(userRole)) {
        const allCourses = await db
          .select({
            id: courses.id,
            title: courses.title,
            imageUrl: courses.imageUrl,
            category: courses.category,
          })
          .from(courses)
          .where(eq(courses.isActive, true))
          .orderBy(desc(courses.createdAt));

        return reply.send(allCourses);
      }

      // Aluno: só cursos onde tem pelo menos um registro de progress
      const accessibleCourses = await db
        .selectDistinct({
          id: courses.id,
          title: courses.title,
          imageUrl: courses.imageUrl,
          category: courses.category,
        })
        .from(courses)
        .innerJoin(modules, eq(modules.courseId, courses.id))
        .innerJoin(lessons, eq(lessons.moduleId, modules.id))
        .innerJoin(progress, eq(progress.lessonId, lessons.id))
        .where(and(eq(progress.userId, userId), eq(courses.isActive, true)))
        .orderBy(desc(courses.createdAt));

      return reply.send(accessibleCourses);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch forum courses' });
    }
  });

  // GET /api/forum/:courseId/topics — lista tópicos de um curso
  app.get('/api/forum/:courseId/topics', async (request, reply) => {
    const params = z.object({ courseId: z.coerce.number().int().positive() }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid course id' });
    }

    const { courseId } = params.data;
    const userId = request.user!.userId;
    const userRole = request.user!.role;

    try {
      // Verificar acesso ao curso (aluno precisa ter progress)
      if (!isAdmin(userRole)) {
        const hasAccess = await db
          .select({ count: sql<number>`count(*)` })
          .from(progress)
          .innerJoin(lessons, eq(lessons.id, progress.lessonId))
          .innerJoin(modules, eq(modules.id, lessons.moduleId))
          .where(and(eq(modules.courseId, courseId), eq(progress.userId, userId)))
          .get();

        if (Number(hasAccess?.count ?? 0) === 0) {
          return reply.status(403).send({ error: 'Access denied to this forum' });
        }
      }

      const topics = await db
        .select({
          id: forumTopics.id,
          title: forumTopics.title,
          isPinned: forumTopics.isPinned,
          isLocked: forumTopics.isLocked,
          createdAt: forumTopics.createdAt,
          authorName: users.name,
          authorRole: users.role,
          replyCount: sql<number>`(SELECT COUNT(*) FROM forum_replies WHERE topic_id = ${forumTopics.id})`,
          likeCount: sql<number>`(SELECT COUNT(*) FROM forum_likes WHERE target_type = 'topic' AND target_id = ${forumTopics.id})`,
        })
        .from(forumTopics)
        .innerJoin(users, eq(users.id, forumTopics.authorId))
        .where(eq(forumTopics.courseId, courseId))
        .orderBy(desc(forumTopics.isPinned), desc(forumTopics.createdAt));

      return reply.send(topics);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch topics' });
    }
  });

  // POST /api/forum/:courseId/topics — criar tópico
  app.post('/api/forum/:courseId/topics', async (request, reply) => {
    const params = z.object({ courseId: z.coerce.number().int().positive() }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid course id' });
    }

    const body = createTopicSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid input', details: body.error.flatten() });
    }

    const { courseId } = params.data;
    const userId = request.user!.userId;
    const userRole = request.user!.role;

    try {
      // Verificar acesso
      if (!isAdmin(userRole)) {
        const hasAccess = await db
          .select({ count: sql<number>`count(*)` })
          .from(progress)
          .innerJoin(lessons, eq(lessons.id, progress.lessonId))
          .innerJoin(modules, eq(modules.id, lessons.moduleId))
          .where(and(eq(modules.courseId, courseId), eq(progress.userId, userId)))
          .get();

        if (Number(hasAccess?.count ?? 0) === 0) {
          return reply.status(403).send({ error: 'Access denied' });
        }
      }

      const result = await db
        .insert(forumTopics)
        .values({
          courseId,
          authorId: userId,
          title: body.data.title,
          content: body.data.content,
        })
        .returning();

      return reply.status(201).send(result[0]);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to create topic' });
    }
  });

  // GET /api/forum/topics/:topicId — detalhe do tópico + replies aninhadas
  app.get('/api/forum/topics/:topicId', async (request, reply) => {
    const params = z.object({ topicId: z.coerce.number().int().positive() }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid topic id' });
    }

    const { topicId } = params.data;
    const userId = request.user!.userId;
    const userRole = request.user!.role;

    try {
      // Buscar tópico com dados do autor e contadores
      const topic = await db
        .select({
          id: forumTopics.id,
          courseId: forumTopics.courseId,
          title: forumTopics.title,
          content: forumTopics.content,
          isPinned: forumTopics.isPinned,
          isLocked: forumTopics.isLocked,
          createdAt: forumTopics.createdAt,
          authorId: forumTopics.authorId,
          authorName: users.name,
          authorRole: users.role,
          likeCount: sql<number>`(SELECT COUNT(*) FROM forum_likes WHERE target_type = 'topic' AND target_id = ${forumTopics.id})`,
          userLiked: sql<boolean>`EXISTS(SELECT 1 FROM forum_likes WHERE user_id = ${userId} AND target_type = 'topic' AND target_id = ${forumTopics.id})`,
        })
        .from(forumTopics)
        .innerJoin(users, eq(users.id, forumTopics.authorId))
        .where(eq(forumTopics.id, topicId))
        .get();

      if (!topic) {
        return reply.status(404).send({ error: 'Topic not found' });
      }

      // Verificar acesso ao curso do tópico
      if (!isAdmin(userRole)) {
        const hasAccess = await db
          .select({ count: sql<number>`count(*)` })
          .from(progress)
          .innerJoin(lessons, eq(lessons.id, progress.lessonId))
          .innerJoin(modules, eq(modules.id, lessons.moduleId))
          .where(and(eq(modules.courseId, topic.courseId), eq(progress.userId, userId)))
          .get();

        if (Number(hasAccess?.count ?? 0) === 0) {
          return reply.status(403).send({ error: 'Access denied' });
        }
      }

      // Buscar todas as replies do tópico (flat list, frontend monta árvore)
      const replies = await db
        .select({
          id: forumReplies.id,
          parentReplyId: forumReplies.parentReplyId,
          content: forumReplies.content,
          createdAt: forumReplies.createdAt,
          authorId: forumReplies.authorId,
          authorName: users.name,
          authorRole: users.role,
          likeCount: sql<number>`(SELECT COUNT(*) FROM forum_likes WHERE target_type = 'reply' AND target_id = ${forumReplies.id})`,
          userLiked: sql<boolean>`EXISTS(SELECT 1 FROM forum_likes WHERE user_id = ${userId} AND target_type = 'reply' AND target_id = ${forumReplies.id})`,
        })
        .from(forumReplies)
        .innerJoin(users, eq(users.id, forumReplies.authorId))
        .where(eq(forumReplies.topicId, topicId))
        .orderBy(asc(forumReplies.createdAt));

      return reply.send({ topic, replies });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch topic' });
    }
  });

  // POST /api/forum/topics/:topicId/replies — criar resposta
  app.post('/api/forum/topics/:topicId/replies', async (request, reply) => {
    const params = z.object({ topicId: z.coerce.number().int().positive() }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid topic id' });
    }

    const body = createReplySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid input', details: body.error.flatten() });
    }

    const { topicId } = params.data;
    const userId = request.user!.userId;
    const userRole = request.user!.role;

    try {
      // Verificar se tópico existe e não está trancado (admin pode responder mesmo trancado)
      const topic = await db.select().from(forumTopics).where(eq(forumTopics.id, topicId)).get();
      if (!topic) {
        return reply.status(404).send({ error: 'Topic not found' });
      }
      if (topic.isLocked && !isAdmin(userRole)) {
        return reply.status(403).send({ error: 'Topic is locked' });
      }

      // Verificar acesso ao curso
      if (!isAdmin(userRole)) {
        const hasAccess = await db
          .select({ count: sql<number>`count(*)` })
          .from(progress)
          .innerJoin(lessons, eq(lessons.id, progress.lessonId))
          .innerJoin(modules, eq(modules.id, lessons.moduleId))
          .where(and(eq(modules.courseId, topic.courseId), eq(progress.userId, userId)))
          .get();

        if (Number(hasAccess?.count ?? 0) === 0) {
          return reply.status(403).send({ error: 'Access denied' });
        }
      }

      // Se for reply-to-reply, validar que a reply pai pertence ao mesmo tópico
      if (body.data.parentReplyId) {
        const parentReply = await db
          .select()
          .from(forumReplies)
          .where(and(eq(forumReplies.id, body.data.parentReplyId), eq(forumReplies.topicId, topicId)))
          .get();

        if (!parentReply) {
          return reply.status(400).send({ error: 'Parent reply not found in this topic' });
        }
      }

      const result = await db
        .insert(forumReplies)
        .values({
          topicId,
          authorId: userId,
          parentReplyId: body.data.parentReplyId ?? null,
          content: body.data.content,
        })
        .returning();

      return reply.status(201).send(result[0]);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to create reply' });
    }
  });

  // POST /api/forum/likes — toggle like/unlike
  app.post('/api/forum/likes', async (request, reply) => {
    const body = toggleLikeSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid input', details: body.error.flatten() });
    }

    const userId = request.user!.userId;
    const { targetType, targetId } = body.data;

    try {
      // Verificar se já curtiu
      const existing = await db
        .select()
        .from(forumLikes)
        .where(
          and(
            eq(forumLikes.userId, userId),
            eq(forumLikes.targetType, targetType),
            eq(forumLikes.targetId, targetId),
          ),
        )
        .get();

      if (existing) {
        // Unlike
        await db
          .delete(forumLikes)
          .where(eq(forumLikes.id, existing.id));

        return reply.send({ liked: false });
      } else {
        // Like
        await db.insert(forumLikes).values({ userId, targetType, targetId });
        return reply.send({ liked: true });
      }
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to toggle like' });
    }
  });

  // PATCH /api/forum/topics/:topicId/pin — admin only: fixar/desafixar tópico
  app.patch('/api/forum/topics/:topicId/pin', async (request, reply) => {
    if (!isAdmin(request.user!.role)) {
      return reply.status(403).send({ error: 'Admin only' });
    }

    const params = z.object({ topicId: z.coerce.number().int().positive() }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid topic id' });
    }

    const body = z.object({ isPinned: z.boolean() }).safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid input' });
    }

    try {
      const result = await db
        .update(forumTopics)
        .set({ isPinned: body.data.isPinned })
        .where(eq(forumTopics.id, params.data.topicId))
        .returning();

      if (result.length === 0) {
        return reply.status(404).send({ error: 'Topic not found' });
      }

      return reply.send(result[0]);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to pin topic' });
    }
  });

  // DELETE /api/forum/topics/:topicId — admin only: deletar tópico
  app.delete('/api/forum/topics/:topicId', async (request, reply) => {
    if (!isAdmin(request.user!.role)) {
      return reply.status(403).send({ error: 'Admin only' });
    }

    const params = z.object({ topicId: z.coerce.number().int().positive() }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid topic id' });
    }

    try {
      const result = await db
        .delete(forumTopics)
        .where(eq(forumTopics.id, params.data.topicId))
        .returning();

      if (result.length === 0) {
        return reply.status(404).send({ error: 'Topic not found' });
      }

      return reply.send({ success: true });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete topic' });
    }
  });
}
