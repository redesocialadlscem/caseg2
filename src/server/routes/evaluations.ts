import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  examQuestions,
  activities,
  activityAttempts,
  examAttempts,
  lessonConfigs,
  lessons,
  progress,
} from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const lessonConfigSchema = z.object({
  hasActivity: z.boolean(),
  hasExam: z.boolean(),
  examDurationMinutes: z.number().int().positive(),
  examPassingScore: z.number().min(0).max(100),
  activityDurationMinutes: z.number().int().positive(),
});

const questionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).min(2),
  correctAnswer: z.number().int().min(0),
});

const submitActivitySchema = z.object({
  answers: z.array(z.number().int().min(0)),
});

const submitExamSchema = z.object({
  answers: z.array(z.number().int().min(0)),
  timeSpentSeconds: z.number().int().min(0),
});

// ─── Plugin ──────────────────────────────────────────────────────────────────

export async function evaluationsRoutes(app: FastifyInstance) {
  // Protege todas as rotas deste plugin com auth
  app.addHook('preHandler', authMiddleware);

  // ─── ADMIN ROUTES ────────────────────────────────────────────────────────

  // Helper para verificar admin
  async function requireAdmin(request: any, reply: any) {
    if (request.user?.role !== 'admin') {
      return reply.status(403).send({ error: 'Admin access required' });
    }
  }

  // PUT /api/admin/lessons/:lessonId/config — upsert lessonConfigs
  app.put('/api/admin/lessons/:lessonId/config', async (request, reply) => {
    await requireAdmin(request, reply);
    if (reply.sent) return;

    const lessonId = Number((request.params as any).lessonId);
    if (!lessonId || isNaN(lessonId)) {
      return reply.status(400).send({ error: 'Invalid lessonId' });
    }

    const parsed = lessonConfigSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
    }

    try {
      const existing = await db
        .select()
        .from(lessonConfigs)
        .where(eq(lessonConfigs.lessonId, lessonId))
        .get();

      if (existing) {
        await db
          .update(lessonConfigs)
          .set(parsed.data)
          .where(eq(lessonConfigs.lessonId, lessonId));
      } else {
        await db.insert(lessonConfigs).values({ lessonId, ...parsed.data });
      }

      return reply.send({ success: true, lessonId });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to save lesson config' });
    }
  });

  // POST /api/admin/lessons/:lessonId/exam-questions — cria questão de prova
  app.post('/api/admin/lessons/:lessonId/exam-questions', async (request, reply) => {
    await requireAdmin(request, reply);
    if (reply.sent) return;

    const lessonId = Number((request.params as any).lessonId);
    if (!lessonId || isNaN(lessonId)) {
      return reply.status(400).send({ error: 'Invalid lessonId' });
    }

    const parsed = questionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
    }

    try {
      // Verifica se a lição existe
      const lesson = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.id, lessonId)).get();
      if (!lesson) {
        return reply.status(404).send({ error: 'Lesson not found' });
      }

      // Pega o próximo orderIndex
      const maxOrder = await db
        .select({ maxIdx: sql<number>`COALESCE(MAX(${examQuestions.orderIndex}), -1)` })
        .from(examQuestions)
        .where(eq(examQuestions.lessonId, lessonId))
        .get();

      const result = await db
        .insert(examQuestions)
        .values({
          lessonId,
          question: parsed.data.question,
          options: JSON.stringify(parsed.data.options),
          correctAnswer: parsed.data.correctAnswer,
          orderIndex: (maxOrder?.maxIdx ?? -1) + 1,
        })
        .returning();

      return reply.status(201).send(result[0]);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to create exam question' });
    }
  });

  // DELETE /api/admin/exam-questions/:id — deleta questão
  app.delete('/api/admin/exam-questions/:id', async (request, reply) => {
    await requireAdmin(request, reply);
    if (reply.sent) return;

    const id = Number((request.params as any).id);
    if (!id || isNaN(id)) {
      return reply.status(400).send({ error: 'Invalid id' });
    }

    try {
      await db.delete(examQuestions).where(eq(examQuestions.id, id));
      return reply.send({ success: true });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete exam question' });
    }
  });

  // POST /api/admin/lessons/:lessonId/activities — cria atividade
  app.post('/api/admin/lessons/:lessonId/activities', async (request, reply) => {
    await requireAdmin(request, reply);
    if (reply.sent) return;

    const lessonId = Number((request.params as any).lessonId);
    if (!lessonId || isNaN(lessonId)) {
      return reply.status(400).send({ error: 'Invalid lessonId' });
    }

    const parsed = questionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
    }

    try {
      const lesson = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.id, lessonId)).get();
      if (!lesson) {
        return reply.status(404).send({ error: 'Lesson not found' });
      }

      const maxOrder = await db
        .select({ maxIdx: sql<number>`COALESCE(MAX(${activities.orderIndex}), -1)` })
        .from(activities)
        .where(eq(activities.lessonId, lessonId))
        .get();

      const result = await db
        .insert(activities)
        .values({
          lessonId,
          question: parsed.data.question,
          options: JSON.stringify(parsed.data.options),
          correctAnswer: parsed.data.correctAnswer,
          orderIndex: (maxOrder?.maxIdx ?? -1) + 1,
        })
        .returning();

      return reply.status(201).send(result[0]);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to create activity' });
    }
  });

  // DELETE /api/admin/activities/:id — deleta atividade
  app.delete('/api/admin/activities/:id', async (request, reply) => {
    await requireAdmin(request, reply);
    if (reply.sent) return;

    const id = Number((request.params as any).id);
    if (!id || isNaN(id)) {
      return reply.status(400).send({ error: 'Invalid id' });
    }

    try {
      await db.delete(activities).where(eq(activities.id, id));
      return reply.send({ success: true });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete activity' });
    }
  });

  // GET /api/admin/lessons/:lessonId/evaluations — retorna config + questões + atividades (com correctAnswer)
  app.get('/api/admin/lessons/:lessonId/evaluations', async (request, reply) => {
    await requireAdmin(request, reply);
    if (reply.sent) return;

    const lessonId = Number((request.params as any).lessonId);
    if (!lessonId || isNaN(lessonId)) {
      return reply.status(400).send({ error: 'Invalid lessonId' });
    }

    try {
      const config = await db
        .select()
        .from(lessonConfigs)
        .where(eq(lessonConfigs.lessonId, lessonId))
        .get();

      const questions = await db
        .select()
        .from(examQuestions)
        .where(eq(examQuestions.lessonId, lessonId))
        .orderBy(examQuestions.orderIndex);

      const acts = await db
        .select()
        .from(activities)
        .where(eq(activities.lessonId, lessonId))
        .orderBy(activities.orderIndex);

      return reply.send({
        config: config ?? null,
        examQuestions: questions.map((q) => ({
          ...q,
          options: JSON.parse(q.options),
        })),
        activities: acts.map((a) => ({
          ...a,
          options: JSON.parse(a.options),
        })),
      });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch evaluations' });
    }
  });

  // ─── STUDENT ROUTES ──────────────────────────────────────────────────────

  // GET /api/lessons/:lessonId/evaluations — retorna config + questões SEM correctAnswer + tentativas
  app.get('/api/lessons/:lessonId/evaluations', async (request, reply) => {
    const userId = request.user!.userId;
    const lessonId = Number((request.params as any).lessonId);
    if (!lessonId || isNaN(lessonId)) {
      return reply.status(400).send({ error: 'Invalid lessonId' });
    }

    try {
      const config = await db
        .select()
        .from(lessonConfigs)
        .where(eq(lessonConfigs.lessonId, lessonId))
        .get();

      const questions = await db
        .select()
        .from(examQuestions)
        .where(eq(examQuestions.lessonId, lessonId))
        .orderBy(examQuestions.orderIndex);

      const acts = await db
        .select()
        .from(activities)
        .where(eq(activities.lessonId, lessonId))
        .orderBy(activities.orderIndex);

      // Busca tentativas anteriores do usuário
      const userExamAttempts = await db
        .select()
        .from(examAttempts)
        .where(and(eq(examAttempts.userId, userId), eq(examAttempts.lessonId, lessonId)))
        .orderBy(examAttempts.completedAt);

      const userActivityAttempts = await db
        .select({
          id: activityAttempts.id,
          activityId: activityAttempts.activityId,
          score: activityAttempts.score,
          completedAt: activityAttempts.completedAt,
        })
        .from(activityAttempts)
        .where(eq(activityAttempts.userId, userId));

      // Filtra apenas tentativas das atividades desta lição
      const activityIds = new Set(acts.map((a) => a.id));
      const filteredActivityAttempts = userActivityAttempts.filter((a) =>
        activityIds.has(a.activityId)
      );

      return reply.send({
        config: config ?? null,
        examQuestions: questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: JSON.parse(q.options),
          orderIndex: q.orderIndex,
          // NÃO envia correctAnswer
        })),
        activities: acts.map((a) => ({
          id: a.id,
          question: a.question,
          options: JSON.parse(a.options),
          orderIndex: a.orderIndex,
          // NÃO envia correctAnswer
        })),
        examAttempts: userExamAttempts.map((e) => ({
          id: e.id,
          score: e.score,
          passed: e.passed,
          timeSpentSeconds: e.timeSpentSeconds,
          completedAt: e.completedAt,
        })),
        activityAttempts: filteredActivityAttempts,
      });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch evaluations' });
    }
  });

  // POST /api/lessons/:lessonId/activity/submit — submete atividade
  app.post('/api/lessons/:lessonId/activity/submit', async (request, reply) => {
    const userId = request.user!.userId;
    const lessonId = Number((request.params as any).lessonId);
    if (!lessonId || isNaN(lessonId)) {
      return reply.status(400).send({ error: 'Invalid lessonId' });
    }

    const parsed = submitActivitySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
    }

    try {
      // Busca todas as atividades da lição
      const acts = await db
        .select()
        .from(activities)
        .where(eq(activities.lessonId, lessonId))
        .orderBy(activities.orderIndex);

      if (acts.length === 0) {
        return reply.status(404).send({ error: 'No activities found for this lesson' });
      }

      const { answers } = parsed.data;

      // Calcula score e detalhes por questão
      let correctCount = 0;
      const details = acts.map((act, idx) => {
        const userAnswer = answers[idx] ?? -1;
        const isCorrect = userAnswer === act.correctAnswer;
        if (isCorrect) correctCount++;
        return {
          activityId: act.id,
          questionIndex: idx,
          userAnswer,
          correctAnswer: act.correctAnswer,
          isCorrect,
        };
      });

      const score = Math.round((correctCount / acts.length) * 100);

      // Salva attempt para cada atividade (ou um attempt consolidado)
      // Aqui salvamos um attempt por atividade individualmente
      for (let i = 0; i < acts.length; i++) {
        await db.insert(activityAttempts).values({
          userId,
          activityId: acts[i].id,
          answers: JSON.stringify([answers[i] ?? -1]),
          score: (answers[i] ?? -1) === acts[i].correctAnswer ? 100 : 0,
        });
      }

      return reply.send({ score, details });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to submit activity' });
    }
  });

  // POST /api/lessons/:lessonId/exam/submit — submite prova
  app.post('/api/lessons/:lessonId/exam/submit', async (request, reply) => {
    const userId = request.user!.userId;
    const lessonId = Number((request.params as any).lessonId);
    if (!lessonId || isNaN(lessonId)) {
      return reply.status(400).send({ error: 'Invalid lessonId' });
    }

    const parsed = submitExamSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
    }

    try {
      // Busca config da lição
      const config = await db
        .select()
        .from(lessonConfigs)
        .where(eq(lessonConfigs.lessonId, lessonId))
        .get();

      if (!config?.hasExam) {
        return reply.status(400).send({ error: 'No exam configured for this lesson' });
      }

      // Busca todas as questões da prova
      const questions = await db
        .select()
        .from(examQuestions)
        .where(eq(examQuestions.lessonId, lessonId))
        .orderBy(examQuestions.orderIndex);

      if (questions.length === 0) {
        return reply.status(404).send({ error: 'No exam questions found' });
      }

      const { answers, timeSpentSeconds } = parsed.data;

      // Calcula score
      let correctCount = 0;
      for (let i = 0; i < questions.length; i++) {
        if ((answers[i] ?? -1) === questions[i].correctAnswer) {
          correctCount++;
        }
      }

      const score = Math.round((correctCount / questions.length) * 100);
      const passed = score >= config.examPassingScore;

      // Salva attempt
      await db.insert(examAttempts).values({
        userId,
        lessonId,
        answers: JSON.stringify(answers),
        score,
        passed,
        timeSpentSeconds,
      });

      // Se passou na prova, vincula ao progresso automaticamente
      let progressUpdated = false;
      if (passed) {
        const existingProgress = await db
          .select()
          .from(progress)
          .where(and(eq(progress.userId, userId), eq(progress.lessonId, lessonId)))
          .get();

        if (!existingProgress) {
          await db.insert(progress).values({
            userId,
            lessonId,
            completed: true,
            completedAt: new Date(),
          });
          progressUpdated = true;
        } else if (!existingProgress.completed) {
          await db
            .update(progress)
            .set({ completed: true, completedAt: new Date() })
            .where(and(eq(progress.userId, userId), eq(progress.lessonId, lessonId)));
          progressUpdated = true;
        }
      }

      // NÃO retorna detalhes das questões — apenas score e passed
      return reply.send({ score, passed, passingScore: config.examPassingScore, progressUpdated });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to submit exam' });
    }
  });
}
