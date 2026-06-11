import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { certificates, courses, modules, lessons, progress } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

const issueSchema = z.object({
  courseId: z.number().int().positive(),
});

export async function certificateRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  // GET /api/certificates/my — lista certificados do usuário
  app.get('/api/certificates/my', async (request, reply) => {
    const userId = request.user!.userId;

    try {
      const certs = await db
        .select({
          id: certificates.id,
          courseId: certificates.courseId,
          issuedAt: certificates.issuedAt,
          pdfPath: certificates.pdfPath,
          courseTitle: courses.title,
          courseCategory: courses.category,
          durationHours: courses.durationHours,
        })
        .from(certificates)
        .innerJoin(courses, eq(courses.id, certificates.courseId))
        .where(eq(certificates.userId, userId))
        .orderBy(sql`${certificates.issuedAt} DESC`);

      return reply.send({ certificates: certs });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch certificates' });
    }
  });

  // POST /api/certificates/issue — emite certificado para curso concluído
  app.post('/api/certificates/issue', async (request, reply) => {
    const userId = request.user!.userId;

    const parsed = issueSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
    }

    const { courseId } = parsed.data;

    try {
      // Verifica se o curso existe
      const course = await db
        .select({ id: courses.id })
        .from(courses)
        .where(and(eq(courses.id, courseId), eq(courses.isActive, true)))
        .get();

      if (!course) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      // Verifica se já tem certificado emitido
      const existingCert = await db
        .select({ id: certificates.id })
        .from(certificates)
        .where(
          and(
            eq(certificates.userId, userId),
            eq(certificates.courseId, courseId)
          )
        )
        .get();

      if (existingCert) {
        return reply.status(409).send({ error: 'Certificate already issued for this course' });
      }

      // Verifica se completou 100% das lições
      const completionCheck = await db
        .select({
          totalLessons: sql<number>`COUNT(DISTINCT ${lessons.id})`,
          completedLessons: sql<number>`COUNT(DISTINCT CASE WHEN ${progress.completed} = 1 THEN ${lessons.id} END)`,
        })
        .from(modules)
        .innerJoin(lessons, eq(lessons.moduleId, modules.id))
        .leftJoin(
          progress,
          and(
            eq(progress.lessonId, lessons.id),
            eq(progress.userId, userId)
          )
        )
        .where(eq(modules.courseId, courseId))
        .get();

      const total = Number(completionCheck?.totalLessons ?? 0);
      const completed = Number(completionCheck?.completedLessons ?? 0);

      if (total === 0 || completed < total) {
        return reply.status(400).send({
          error: 'Course not completed',
          details: { totalLessons: total, completedLessons: completed },
        });
      }

      // Emite o certificado
      const [newCert] = await db
        .insert(certificates)
        .values({
          userId,
          courseId,
          issuedAt: new Date(),
          pdfPath: '',
        })
        .returning();

      return reply.status(201).send({ certificate: newCert });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to issue certificate' });
    }
  });
}
