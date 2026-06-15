import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { desc, eq, sql, asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { courses, modules, lessons } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

// ─── Schemas Zod ─────────────────────────────────────────────────────────────
const createCourseSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isFeatured: z.boolean().optional(),
});

const updateCourseSchema = z.object({
  title: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const moduleIdParamSchema = z.object({
  moduleId: z.coerce.number().int().positive(),
});

const createModuleSchema = z.object({
  title: z.string().min(1),
  order: z.number().int().min(0).optional(),
});

// ─── Admin guard helper ──────────────────────────────────────────────────────
function isAdmin(request: any): boolean {
  return request.user?.role === 'admin';
}

// ─── Routes ──────────────────────────────────────────────────────────────────
export async function adminCourseRoutes(app: FastifyInstance) {
  // All routes require auth + admin role
  app.addHook('preHandler', async (request, reply) => {
    await authMiddleware(request, reply);
    if (reply.sent) return;
    if (!isAdmin(request)) {
      return reply.status(403).send({ error: 'Admin access required' });
    }
  });

  // GET /api/admin/courses — lista todos os cursos (incluindo inativos)
  app.get('/api/admin/courses', async (_request, reply) => {
    try {
      const allCourses = await db.select({
        id: courses.id,
        title: courses.title,
        category: courses.category,
        description: courses.description,
        imageUrl: courses.imageUrl,
        isFeatured: courses.isFeatured,
        isActive: courses.isActive,
        createdAt: courses.createdAt,
      })
        .from(courses)
        .orderBy(desc(courses.createdAt));

      return reply.send(allCourses);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch courses' });
    }
  });

  // POST /api/admin/courses — cria novo curso
  app.post('/api/admin/courses', async (request, reply) => {
    const parsed = createCourseSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
    }

    try {
      const result = await db.insert(courses)
        .values(parsed.data)
        .returning();

      return reply.status(201).send(result[0]);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to create course' });
    }
  });

  // PUT /api/admin/courses/:id — atualiza curso existente
  app.put('/api/admin/courses/:id', async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid course id' });
    }

    const parsed = updateCourseSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
    }

    // Check if at least one field is provided
    if (Object.keys(parsed.data).length === 0) {
      return reply.status(400).send({ error: 'At least one field must be provided' });
    }

    try {
      const updated = await db.update(courses)
        .set(parsed.data)
        .where(eq(courses.id, params.data.id))
        .returning();

      if (updated.length === 0) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      return reply.send(updated[0]);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to update course' });
    }
  });

  // DELETE /api/admin/courses/:id — soft delete (isActive = false)
  app.delete('/api/admin/courses/:id', async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid course id' });
    }

    try {
      const updated = await db.update(courses)
        .set({ isActive: false })
        .where(eq(courses.id, params.data.id))
        .returning();

      if (updated.length === 0) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      return reply.status(204).send();
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to deactivate course' });
    }
  });

  // GET /api/admin/courses/:id/modules — lista módulos com lessonCount
  app.get('/api/admin/courses/:id/modules', async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid course id' });
    }

    try {
      // Verify course exists
      const course = await db.select({ id: courses.id })
        .from(courses)
        .where(eq(courses.id, params.data.id))
        .get();

      if (!course) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      // Get modules with lesson count
      const courseModules = await db.select({
        id: modules.id,
        title: modules.title,
        orderIndex: modules.orderIndex,
        lessonCount: sql<number>`COALESCE(COUNT(${lessons.id}), 0)`,
      })
        .from(modules)
        .leftJoin(lessons, eq(lessons.moduleId, modules.id))
        .where(eq(modules.courseId, params.data.id))
        .groupBy(modules.id)
        .orderBy(asc(modules.orderIndex));

      return reply.send(courseModules.map(m => ({
        id: m.id,
        title: m.title,
        order: m.orderIndex,
        lessonCount: Number(m.lessonCount),
      })));
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch modules' });
    }
  });

  // POST /api/admin/courses/:id/modules — adiciona módulo a um curso
  app.post('/api/admin/courses/:id/modules', async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid course id' });
    }

    const parsed = createModuleSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
    }

    try {
      // Verify course exists
      const course = await db.select({ id: courses.id })
        .from(courses)
        .where(eq(courses.id, params.data.id))
        .get();

      if (!course) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      // Determine order
      let orderIndex = parsed.data.order;
      if (orderIndex === undefined) {
        const maxResult = await db.select({ maxOrder: sql<number>`COALESCE(MAX(${modules.orderIndex}), -1)` })
          .from(modules)
          .where(eq(modules.courseId, params.data.id));
        orderIndex = Number(maxResult[0]?.maxOrder ?? -1) + 1;
      }

      const result = await db.insert(modules)
        .values({
          courseId: params.data.id,
          title: parsed.data.title,
          orderIndex,
        })
        .returning();

      return reply.status(201).send(result[0]);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to create module' });
    }
  });

  // DELETE /api/admin/modules/:moduleId — deleta módulo e suas lições (cascade manual)
  app.delete('/api/admin/modules/:moduleId', async (request, reply) => {
    const params = moduleIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid module id' });
    }

    try {
      // Verify module exists
      const mod = await db.select({ id: modules.id })
        .from(modules)
        .where(eq(modules.id, params.data.moduleId))
        .get();

      if (!mod) {
        return reply.status(404).send({ error: 'Module not found' });
      }

      // Delete associated lessons first (manual cascade)
      await db.delete(lessons)
        .where(eq(lessons.moduleId, params.data.moduleId));

      // Delete the module
      await db.delete(modules)
        .where(eq(modules.id, params.data.moduleId));

      return reply.status(204).send();
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete module' });
    }
  });
}
