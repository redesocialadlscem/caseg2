import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { certificates, courses, modules, lessons, progress, users } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateCourseCertificatePdf } from '../lib/certificatePdf.js';

/** Código de verificação do certificado (mesmo formato do painel admin). */
function certificateCode(id: number, issuedAt: Date | number | string): string {
  const date = typeof issuedAt === 'number' ? new Date(issuedAt * 1000) : new Date(issuedAt);
  const year = isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
  return `CERT-${year}-${10000 + id}`;
}

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

  // GET /api/certificates/:id/download — gera e baixa o PDF do certificado
  app.get('/api/certificates/:id/download', async (request, reply) => {
    const userId = request.user!.userId;
    const role = request.user!.role;

    const params = z.object({ id: z.coerce.number().int().positive() }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid certificate id' });
    }

    try {
      const cert = await db
        .select({
          id: certificates.id,
          userId: certificates.userId,
          issuedAt: certificates.issuedAt,
          studentName: users.name,
          courseTitle: courses.title,
          courseCategory: courses.category,
          durationHours: courses.durationHours,
        })
        .from(certificates)
        .innerJoin(courses, eq(courses.id, certificates.courseId))
        .innerJoin(users, eq(users.id, certificates.userId))
        .where(eq(certificates.id, params.data.id))
        .get();

      if (!cert) {
        return reply.status(404).send({ error: 'Certificate not found' });
      }
      // Só o dono ou um admin pode baixar
      if (cert.userId !== userId && role !== 'admin') {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const pdf = await generateCourseCertificatePdf({
        studentName: cert.studentName,
        courseTitle: cert.courseTitle,
        category: cert.courseCategory,
        durationHours: cert.durationHours,
        issuedAt: cert.issuedAt as unknown as Date,
        code: certificateCode(cert.id, cert.issuedAt as unknown as Date),
      });

      const safeTitle = cert.courseTitle.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 40);
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename="certificado_${safeTitle}.pdf"`);
      return reply.send(pdf);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to generate certificate PDF' });
    }
  });
}
