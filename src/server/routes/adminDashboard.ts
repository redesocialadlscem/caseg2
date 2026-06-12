import { FastifyInstance } from 'fastify';
import { desc, eq, sql, count } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, courses, certificates, progress, lessons, modules } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

// ─── Admin guard helper ──────────────────────────────────────────────────────
function isAdmin(request: any): boolean {
  return request.user?.role === 'admin';
}

// ─── Routes ──────────────────────────────────────────────────────────────────
export async function adminDashboardRoutes(app: FastifyInstance) {
  // All routes require auth + admin role
  app.addHook('preHandler', async (request, reply) => {
    await authMiddleware(request, reply);
    if (reply.sent) return;
    if (!isAdmin(request)) {
      return reply.status(403).send({ error: 'Admin access required' });
    }
  });

  // GET /api/admin/dashboard/stats
  app.get('/api/admin/dashboard/stats', async (_request, reply) => {
    try {
      // Run all independent queries in parallel
      const [
        studentsResult,
        coursesResult,
        certsResult,
        completionResult,
        recentCerts,
        recentUsers,
        popularCoursesResult,
      ] = await Promise.all([
        // Total students
        db.select({ total: count() }).from(users).where(eq(users.role, 'student')),

        // Total active courses
        db.select({ total: count() }).from(courses).where(eq(courses.isActive, true)),

        // Total certificates
        db.select({ total: count() }).from(certificates),

        // Completion rate: completed progress / total lessons * 100
        db.select({
          completedCount: sql<number>`COALESCE((SELECT COUNT(*) FROM progress WHERE completed = 1), 0)`,
          totalLessons: sql<number>`COALESCE((SELECT COUNT(*) FROM lessons), 1)`,
        }).from(sql`(SELECT 1 as dummy)`),

        // Recent certificates (last 5)
        db.select({
          id: certificates.id,
          userName: users.name,
          courseTitle: courses.title,
          issuedAt: certificates.issuedAt,
        })
          .from(certificates)
          .innerJoin(users, eq(certificates.userId, users.id))
          .innerJoin(courses, eq(certificates.courseId, courses.id))
          .orderBy(desc(certificates.issuedAt))
          .limit(5),

        // Recent user registrations (last 5)
        db.select({
          id: users.id,
          name: users.name,
          createdAt: users.createdAt,
        })
          .from(users)
          .where(eq(users.role, 'student'))
          .orderBy(desc(users.createdAt))
          .limit(5),

        // Popular courses: top 5 by distinct students with progress
        db.select({
          courseTitle: courses.title,
          studentCount: sql<number>`COUNT(DISTINCT ${progress.userId})`,
        })
          .from(progress)
          .innerJoin(lessons, eq(progress.lessonId, lessons.id))
          .innerJoin(modules, eq(lessons.moduleId, modules.id))
          .innerJoin(courses, eq(modules.courseId, courses.id))
          .groupBy(courses.id, courses.title)
          .orderBy(sql`COUNT(DISTINCT ${progress.userId}) DESC`)
          .limit(5),
      ]);

      const totalStudents = studentsResult[0]?.total ?? 0;
      const totalCourses = coursesResult[0]?.total ?? 0;
      const totalCertificates = certsResult[0]?.total ?? 0;

      const completedCount = Number(completionResult[0]?.completedCount ?? 0);
      const totalLessons = Number(completionResult[0]?.totalLessons ?? 1);
      const completionRate = totalLessons > 0
        ? Math.round((completedCount / totalLessons) * 100)
        : 0;

      // Merge recent activity: certificates + registrations, sorted by date desc
      const certActivities = recentCerts.map((c) => ({
        type: 'certificate' as const,
        student: c.userName,
        course: c.courseTitle,
        action: 'Emitiu Certificado',
        date: c.issuedAt instanceof Date ? c.issuedAt.toISOString() : String(c.issuedAt),
      }));

      const regActivities = recentUsers.map((u) => ({
        type: 'registration' as const,
        student: u.name,
        course: '',
        action: 'Novo Cadastro',
        date: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
      }));

      const recentActivity = [...certActivities, ...regActivities]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8);

      const popularCourses = popularCoursesResult.map((c) => ({
        name: c.courseTitle,
        students: Number(c.studentCount),
      }));

      return reply.send({
        totalStudents,
        totalCourses,
        totalCertificates,
        completionRate,
        recentActivity,
        popularCourses,
      });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch dashboard stats' });
    }
  });
}
