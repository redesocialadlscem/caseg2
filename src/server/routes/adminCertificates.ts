import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, sql, and, desc, gte, lte } from 'drizzle-orm';
import { db } from '../db/index.js';
import { certificates, courses, users, progress, lessons, modules } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const listCertsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  student: z.string().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

function isAdmin(request: any): boolean {
  return request.user?.role === 'admin';
}

export async function adminCertificateRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request, reply) => {
    await authMiddleware(request, reply);
    if (reply.sent) return;
    if (!isAdmin(request)) {
      return reply.status(403).send({ error: 'Admin access required' });
    }
  });

  // GET /api/admin/certificates — list certificates with server-side pagination
  app.get('/api/admin/certificates', async (request, reply) => {
    const parsed = listCertsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid query params', details: parsed.error.flatten() });
    }

    const { page, limit, search, student, dateFrom, dateTo } = parsed.data;
    const offset = (page - 1) * limit;

    try {
      const conditions = [];

      if (search) {
        conditions.push(
          sql`(${users.name} LIKE ${`%${search}%`} OR ${courses.title} LIKE ${`%${search}%`})`
        );
      }

      if (student) {
        conditions.push(sql`${users.name} LIKE ${`%${student}%`}`);
      }

      if (dateFrom) {
        conditions.push(gte(certificates.issuedAt, new Date(dateFrom)));
      }

      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        conditions.push(lte(certificates.issuedAt, toDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [certs, countResult] = await Promise.all([
        db
          .select({
            id: certificates.id,
            studentName: users.name,
            studentEmail: users.email,
            courseName: courses.title,
            courseCategory: courses.category,
            issuedAt: certificates.issuedAt,
            durationHours: courses.durationHours,
          })
          .from(certificates)
          .innerJoin(users, eq(users.id, certificates.userId))
          .innerJoin(courses, eq(courses.id, certificates.courseId))
          .where(whereClause)
          .orderBy(desc(certificates.issuedAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ total: sql<number>`COUNT(*)` })
          .from(certificates)
          .innerJoin(users, eq(users.id, certificates.userId))
          .innerJoin(courses, eq(courses.id, certificates.courseId))
          .where(whereClause),
      ]);

      const total = Number(countResult[0]?.total ?? 0);

      const result = certs.map((c) => ({
        id: String(c.id),
        studentName: c.studentName,
        studentEmail: c.studentEmail,
        courseName: c.courseName,
        courseCategory: c.courseCategory,
        issuedAt: c.issuedAt instanceof Date
          ? c.issuedAt.toISOString().split('T')[0]
          : String(c.issuedAt),
        code: `CERT-${new Date(c.issuedAt).getFullYear()}-${10000 + Number(c.id)}`,
        durationHours: c.durationHours,
      }));

      return reply.send({ certificates: result, total, page, limit });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch certificates' });
    }
  });

  // GET /api/admin/certificates/export — export filtered certificates as CSV
  app.get('/api/admin/certificates/export', async (request, reply) => {
    const querySchema = z.object({
      search: z.string().optional(),
      student: z.string().optional(),
      dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    });

    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid query params', details: parsed.error.flatten() });
    }

    const { search, student, dateFrom, dateTo } = parsed.data;

    try {
      const conditions = [];

      if (search) {
        conditions.push(
          sql`(${users.name} LIKE ${`%${search}%`} OR ${courses.title} LIKE ${`%${search}%`})`
        );
      }

      if (student) {
        conditions.push(sql`${users.name} LIKE ${`%${student}%`}`);
      }

      if (dateFrom) {
        conditions.push(gte(certificates.issuedAt, new Date(dateFrom)));
      }

      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        conditions.push(lte(certificates.issuedAt, toDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const certs = await db
        .select({
          id: certificates.id,
          studentName: users.name,
          studentEmail: users.email,
          courseName: courses.title,
          issuedAt: certificates.issuedAt,
          durationHours: courses.durationHours,
        })
        .from(certificates)
        .innerJoin(users, eq(users.id, certificates.userId))
        .innerJoin(courses, eq(courses.id, certificates.courseId))
        .where(whereClause)
        .orderBy(desc(certificates.issuedAt));

      // Build CSV
      const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
      const header = 'Código,Aluno,Email,Curso,Data Emissão,Carga Horária (h)';
      const rows = certs.map((c) => {
        const code = `CERT-${new Date(c.issuedAt).getFullYear()}-${10000 + Number(c.id)}`;
        const date = c.issuedAt instanceof Date
          ? c.issuedAt.toISOString().split('T')[0]
          : String(c.issuedAt);
        return [
          code,
          `"${(c.studentName ?? '').replace(/"/g, '""')}"`,
          `"${(c.studentEmail ?? '').replace(/"/g, '""')}"`,
          `"${(c.courseName ?? '').replace(/"/g, '""')}"`,
          date,
          c.durationHours,
        ].join(',');
      });

      const csv = BOM + header + '\n' + rows.join('\n');
      const filename = `certificados_${new Date().toISOString().split('T')[0]}.csv`;

      return reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(csv);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to export certificates' });
    }
  });

  // DELETE /api/admin/certificates/:id — revoke a certificate
  app.delete('/api/admin/certificates/:id', async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid certificate id' });
    }

    try {
      const deleted = await db
        .delete(certificates)
        .where(eq(certificates.id, params.data.id))
        .returning();

      if (deleted.length === 0) {
        return reply.status(404).send({ error: 'Certificate not found' });
      }

      return reply.send({ success: true, id: deleted[0].id });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to revoke certificate' });
    }
  });

  // GET /api/admin/users/:id/progress — user course progress
  app.get('/api/admin/users/:id/progress', async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid user id' });
    }

    try {
      const result = await db
        .select({
          courseName: courses.title,
          totalLessons: sql<number>`COUNT(DISTINCT ${lessons.id})`,
          completedLessons: sql<number>`COUNT(DISTINCT CASE WHEN ${progress.completed} = 1 THEN ${lessons.id} END)`,
        })
        .from(courses)
        .innerJoin(modules, eq(modules.courseId, courses.id))
        .innerJoin(lessons, eq(lessons.moduleId, modules.id))
        .leftJoin(
          progress,
          and(
            eq(progress.lessonId, lessons.id),
            eq(progress.userId, params.data.id)
          )
        )
        .where(eq(courses.isActive, true))
        .groupBy(courses.id);

      const userProgress = result.map((r) => ({
        courseName: r.courseName,
        totalLessons: Number(r.totalLessons),
        completedLessons: Number(r.completedLessons),
        progress: Number(r.totalLessons) > 0
          ? Math.round((Number(r.completedLessons) / Number(r.totalLessons)) * 100)
          : 0,
      }));

      return reply.send(userProgress);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch user progress' });
    }
  });

  // GET /api/admin/users/:id/certificates — user certificates
  app.get('/api/admin/users/:id/certificates', async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid user id' });
    }

    try {
      const certs = await db
        .select({
          courseName: courses.title,
          issuedAt: certificates.issuedAt,
        })
        .from(certificates)
        .innerJoin(courses, eq(courses.id, certificates.courseId))
        .where(eq(certificates.userId, params.data.id))
        .orderBy(sql`${certificates.issuedAt} DESC`);

      return reply.send(certs.map((c) => ({
        courseName: c.courseName,
        issuedAt: c.issuedAt instanceof Date
          ? c.issuedAt.toISOString().split('T')[0]
          : String(c.issuedAt),
      })));
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch user certificates' });
    }
  });
}
