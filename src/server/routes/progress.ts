import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { progress, lessons, modules, courses } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { issueCourseCertificateIfComplete, courseIdForLesson } from '../lib/courseCompletion.js';

const markProgressSchema = z.object({
  lessonId: z.number().int().positive(),
});

export async function progressRoutes(app: FastifyInstance) {
  // Protege todas as rotas deste plugin
  app.addHook('preHandler', authMiddleware);

  // GET /api/progress/my — progresso do usuário autenticado agrupado por curso
  app.get('/api/progress/my', async (request, reply) => {
    const userId = request.user!.userId;

    try {
      // Busca todos os cursos com contagem total de lições e lições concluídas pelo usuário
      const courseProgress = await db
        .select({
          courseId: courses.id,
          title: courses.title,
          description: courses.description,
          category: courses.category,
          durationHours: courses.durationHours,
          totalLessons: sql<number>`COUNT(DISTINCT ${lessons.id})`,
          completedLessons: sql<number>`COUNT(DISTINCT CASE WHEN ${progress.completed} = 1 THEN ${lessons.id} END)`,
        })
        .from(courses)
        .leftJoin(modules, eq(modules.courseId, courses.id))
        .leftJoin(lessons, eq(lessons.moduleId, modules.id))
        .leftJoin(
          progress,
          and(
            eq(progress.lessonId, lessons.id),
            eq(progress.userId, userId)
          )
        )
        .where(eq(courses.isActive, true))
        .groupBy(courses.id);

      // Filtra apenas cursos onde o usuário tem algum progresso
      const inProgress = courseProgress
        .filter((c) => Number(c.completedLessons) > 0)
        .map((c) => {
          const total = Number(c.totalLessons);
          const completed = Number(c.completedLessons);
          const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
          return {
            courseId: c.courseId,
            title: c.title,
            description: c.description,
            category: c.category,
            durationHours: c.durationHours,
            totalLessons: total,
            completedLessons: completed,
            progress: percent,
          };
        });

      // Stats agregados
      const totalCompletedLessons = inProgress.reduce(
        (sum, c) => sum + c.completedLessons,
        0
      );
      const totalLessonsAll = inProgress.reduce(
        (sum, c) => sum + c.totalLessons,
        0
      );
      const coursesInProgress = inProgress.filter(
        (c) => c.progress > 0 && c.progress < 100
      ).length;
      const coursesCompleted = inProgress.filter(
        (c) => c.progress === 100
      ).length;
      const overallProgress =
        totalLessonsAll > 0
          ? Math.round((totalCompletedLessons / totalLessonsAll) * 100)
          : 0;

      // Horas estimadas: soma proporcional das horas dos cursos com progresso
      const estimatedHours = inProgress.reduce(
        (sum, c) => sum + (c.durationHours * c.progress) / 100,
        0
      );

      return reply.send({
        courses: inProgress,
        stats: {
          coursesInProgress,
          coursesCompleted,
          totalCompletedLessons,
          estimatedHours: Math.round(estimatedHours),
          overallProgress,
        },
      });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch progress' });
    }
  });

  // POST /api/progress — marca uma lição como concluída
  app.post('/api/progress', async (request, reply) => {
    const userId = request.user!.userId;

    const parsed = markProgressSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: 'Invalid body', details: parsed.error.flatten() });
    }

    const { lessonId } = parsed.data;

    try {
      // Verifica se a lição existe
      const lesson = await db
        .select({ id: lessons.id })
        .from(lessons)
        .where(eq(lessons.id, lessonId))
        .get();

      if (!lesson) {
        return reply.status(404).send({ error: 'Lesson not found' });
      }

      // Upsert: insere ou atualiza progresso
      const existing = await db
        .select()
        .from(progress)
        .where(
          and(
            eq(progress.userId, userId),
            eq(progress.lessonId, lessonId)
          )
        )
        .get();

      if (existing) {
        await db
          .update(progress)
          .set({ completed: true, completedAt: new Date() })
          .where(eq(progress.id, existing.id));
      } else {
        await db.insert(progress).values({
          userId,
          lessonId,
          completed: true,
          completedAt: new Date(),
        });
      }

      // Auto-emite o certificado se esta lição concluiu o curso (idempotente).
      let certificateIssued = false;
      let certificateId: number | null = null;
      const courseId = await courseIdForLesson(lessonId);
      if (courseId) {
        const result = await issueCourseCertificateIfComplete(userId, courseId);
        if (result) {
          certificateId = result.certificate.id;
          certificateIssued = !result.alreadyExisted;
        }
      }

      return reply.send({ success: true, lessonId, certificateIssued, certificateId });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to update progress' });
    }
  });
}
