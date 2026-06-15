import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { desc, eq, and, like, sql, asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { courses, modules, lessons, progress } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

const listQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
});

export async function courseRoutes(app: FastifyInstance) {
  // GET /api/courses/featured — cursos em destaque (rota deve vir ANTES de /api/courses/:id)
  app.get('/api/courses/featured', async (_request, reply) => {
    try {
      const featured = await db
        .select({
          id: courses.id,
          title: courses.title,
          description: courses.description,
          category: courses.category,
          durationHours: courses.durationHours,
          imageUrl: courses.imageUrl,
          price: courses.price,
          isFeatured: courses.isFeatured,
        })
        .from(courses)
        .where(and(eq(courses.isActive, true), eq(courses.isFeatured, true)))
        .orderBy(desc(courses.createdAt))
        .limit(6);

      return reply.send(featured);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch featured courses' });
    }
  });

  // GET /api/courses — lista pública de cursos ativos
  app.get('/api/courses', async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid query', details: parsed.error.flatten() });
    }

    const { search, category, page, limit } = parsed.data;
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [eq(courses.isActive, true)];

    if (category && category !== 'Todos') {
      conditions.push(eq(courses.category, category));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        sql`(${courses.title} LIKE ${searchTerm} OR ${courses.description} LIKE ${searchTerm})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const allCourses = await db.select().from(courses)
      .where(whereClause)
      .orderBy(desc(courses.createdAt))
      .limit(limit)
      .offset(offset);

    // Count total for pagination
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(courses)
      .where(whereClause);

    const total = Number(countResult[0]?.count ?? 0);

    return reply.send({
      courses: allCourses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  // GET /api/courses/:id — detalhe público de um curso
  app.get('/api/courses/:id', async (request, reply) => {
    const params = z.object({ id: z.coerce.number().int().positive() }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid course id' });
    }

    const course = await db.select().from(courses)
      .where(and(eq(courses.id, params.data.id), eq(courses.isActive, true)))
      .get();

    if (!course) {
      return reply.status(404).send({ error: 'Course not found' });
    }

    return reply.send(course);
  });

  // GET /api/courses/:courseId/player — estrutura completa do curso para o player (protegido)
  app.get('/api/courses/:courseId/player', {
    preHandler: authMiddleware,
  }, async (request, reply) => {
    const params = z.object({ courseId: z.coerce.number().int().positive() }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid course id' });
    }

    const userId = request.user!.userId;
    const { courseId } = params.data;

    try {
      // 1. Buscar dados do curso
      const course = await db.select().from(courses)
        .where(and(eq(courses.id, courseId), eq(courses.isActive, true)))
        .get();

      if (!course) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      // 2. Buscar módulos ordenados
      const courseModules = await db.select().from(modules)
        .where(eq(modules.courseId, courseId))
        .orderBy(asc(modules.orderIndex));

      if (courseModules.length === 0) {
        return reply.send({
          course,
          modules: [],
        });
      }

      // 3. Buscar todas as lições desses módulos
      const moduleIds = courseModules.map(m => m.id);
      
      // Drizzle doesn't have a simple "IN" operator helper without importing inArray
      // Using sql template for safety and simplicity with dynamic array
      const allLessons = await db.select({
        id: lessons.id,
        moduleId: lessons.moduleId,
        title: lessons.title,
        content: lessons.content,
        videoUrl: lessons.videoUrl,
        orderIndex: lessons.orderIndex,
        completed: progress.completed,
      })
        .from(lessons)
        .leftJoin(
          progress,
          and(
            eq(progress.lessonId, lessons.id),
            eq(progress.userId, userId)
          )
        )
        .where(sql`${lessons.moduleId} IN (${sql.join(moduleIds.map(id => sql`${id}`), sql`, `)})`)
        .orderBy(asc(lessons.orderIndex));

      // 4. Agrupar lições por módulo
      const lessonsByModule = new Map<number, typeof allLessons>();
      for (const lesson of allLessons) {
        const list = lessonsByModule.get(lesson.moduleId) || [];
        list.push({
          ...lesson,
          completed: !!lesson.completed,
        });
        lessonsByModule.set(lesson.moduleId, list);
      }

      // 5. Montar estrutura final
      const structuredModules = courseModules.map(m => ({
        id: m.id,
        title: m.title,
        orderIndex: m.orderIndex,
        lessons: lessonsByModule.get(m.id) || [],
      }));

      return reply.send({
        course,
        modules: structuredModules,
      });

    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch course player data' });
    }
  });
}
