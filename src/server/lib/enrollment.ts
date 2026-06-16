import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { enrollments, courses } from '../db/schema.js';
import type { Enrollment } from '../db/schema.js';

export type EnrollmentSource = 'purchase' | 'free' | 'admin' | 'corporate';

/** Retorna true se o usuário já possui matrícula no curso. */
export async function isEnrolled(userId: number, courseId: number): Promise<boolean> {
  const row = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
    .get();
  return !!row;
}

/**
 * Garante que exista uma matrícula (idempotente graças ao índice único).
 * Retorna a matrícula existente ou a recém-criada.
 */
export async function ensureEnrollment(
  userId: number,
  courseId: number,
  source: EnrollmentSource,
): Promise<Enrollment> {
  const existing = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
    .get();
  if (existing) return existing;

  await db
    .insert(enrollments)
    .values({ userId, courseId, source })
    .onConflictDoNothing();

  // Relê para cobrir a corrida (dois requests simultâneos)
  const row = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
    .get();
  return row!;
}

/** Curso gratuito = preço 0. Cursos gratuitos liberam acesso sem matrícula. */
export async function isFreeCourse(courseId: number): Promise<boolean> {
  const course = await db
    .select({ price: courses.price })
    .from(courses)
    .where(eq(courses.id, courseId))
    .get();
  return !!course && Number(course.price) === 0;
}

/**
 * Regra única de acesso a um curso:
 *  - admin acessa tudo
 *  - aluno matriculado acessa
 *  - curso gratuito é liberado a qualquer aluno logado
 */
export async function canAccessCourse(
  userId: number,
  role: 'student' | 'admin',
  courseId: number,
): Promise<boolean> {
  if (role === 'admin') return true;
  if (await isEnrolled(userId, courseId)) return true;
  if (await isFreeCourse(courseId)) return true;
  return false;
}
