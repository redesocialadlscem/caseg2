import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { certificates, modules, lessons, progress } from '../db/schema.js';

export interface IssueResult {
  certificate: typeof certificates.$inferSelect;
  alreadyExisted: boolean;
}

/**
 * Emite o certificado do curso se o usuário concluiu 100% das lições e ainda
 * não possui certificado. Idempotente.
 *
 * Retorna:
 *  - { certificate, alreadyExisted } quando há certificado (novo ou já existente);
 *  - null quando o curso ainda não foi 100% concluído (ou não tem lições).
 */
export async function issueCourseCertificateIfComplete(
  userId: number,
  courseId: number,
): Promise<IssueResult | null> {
  // Já emitido? (idempotente)
  const existing = await db
    .select()
    .from(certificates)
    .where(and(eq(certificates.userId, userId), eq(certificates.courseId, courseId)))
    .get();
  if (existing) return { certificate: existing, alreadyExisted: true };

  // Concluiu 100% das lições do curso?
  const check = await db
    .select({
      totalLessons: sql<number>`COUNT(DISTINCT ${lessons.id})`,
      completedLessons: sql<number>`COUNT(DISTINCT CASE WHEN ${progress.completed} = 1 THEN ${lessons.id} END)`,
    })
    .from(modules)
    .innerJoin(lessons, eq(lessons.moduleId, modules.id))
    .leftJoin(progress, and(eq(progress.lessonId, lessons.id), eq(progress.userId, userId)))
    .where(eq(modules.courseId, courseId))
    .get();

  const total = Number(check?.totalLessons ?? 0);
  const completed = Number(check?.completedLessons ?? 0);
  if (total === 0 || completed < total) return null;

  const [cert] = await db
    .insert(certificates)
    .values({ userId, courseId, issuedAt: new Date(), pdfPath: '' })
    .returning();
  return { certificate: cert, alreadyExisted: false };
}

/** Descobre o courseId a partir de uma lição. */
export async function courseIdForLesson(lessonId: number): Promise<number | null> {
  const row = await db
    .select({ courseId: modules.courseId })
    .from(lessons)
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .where(eq(lessons.id, lessonId))
    .get();
  return row?.courseId ?? null;
}
