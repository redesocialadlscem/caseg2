import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { and, eq, desc, asc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { interactions, sessionInteractions, interactionResponses, liveSessions } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

// ─── Schemas ─────────────────────────────────────────────────────────────────
const interactionSchema = z.object({
  type: z.enum(['quiz', 'truefalse', 'poll']),
  question: z.string().min(1).max(2000),
  options: z.array(z.string().min(1)).min(2).max(8),
  correctAnswer: z.number().int().min(0).nullable().optional(),
  timeLimitSeconds: z.number().int().min(5).max(600).default(20),
  category: z.string().max(120).optional().default(''),
});

const respondSchema = z.object({
  participantName: z.string().min(1).max(120),
  answer: z.number().int().min(0),
  responseMs: z.number().int().min(0).max(3_600_000).default(0),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function adminGuard(request: FastifyRequest, reply: FastifyReply) {
  await authMiddleware(request, reply);
  if (reply.sent) return;
  if (request.user?.role !== 'admin') {
    return reply.status(403).send({ error: 'Admin access required' });
  }
}

/** Normaliza correctAnswer conforme o tipo (enquete não tem resposta certa). */
function normalizeCorrect(type: string, correct: number | null | undefined): number | null {
  if (type === 'poll') return null;
  return typeof correct === 'number' ? correct : null;
}

export async function interactionsRoutes(app: FastifyInstance) {
  // ─── BANCO DE INTERAÇÕES (admin) ───────────────────────────────────────────

  // GET /api/admin/interactions — lista (filtros opcionais por type/category)
  app.get('/api/admin/interactions', { preHandler: adminGuard }, async (request, reply) => {
    const q = z.object({ type: z.string().optional(), category: z.string().optional() }).safeParse(request.query);
    const conds = [] as any[];
    if (q.success && q.data.type) conds.push(eq(interactions.type, q.data.type as any));
    if (q.success && q.data.category) conds.push(eq(interactions.category, q.data.category));
    const rows = await db.select().from(interactions)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(interactions.createdAt));
    return reply.send({
      interactions: rows.map((r) => ({ ...r, options: JSON.parse(r.options) })),
    });
  });

  // POST /api/admin/interactions — cria
  app.post('/api/admin/interactions', { preHandler: adminGuard }, async (request, reply) => {
    const parsed = interactionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
    }
    const d = parsed.data;
    const [row] = await db.insert(interactions).values({
      type: d.type,
      question: d.question,
      options: JSON.stringify(d.options),
      correctAnswer: normalizeCorrect(d.type, d.correctAnswer),
      timeLimitSeconds: d.timeLimitSeconds,
      category: d.category || '',
      createdBy: request.user!.userId,
    }).returning();
    return reply.status(201).send({ interaction: { ...row, options: JSON.parse(row.options) } });
  });

  // PUT /api/admin/interactions/:id — atualiza
  app.put('/api/admin/interactions/:id', { preHandler: adminGuard }, async (request, reply) => {
    const idP = z.object({ id: z.coerce.number().int().positive() }).safeParse(request.params);
    if (!idP.success) return reply.status(400).send({ error: 'Invalid id' });
    const parsed = interactionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
    }
    const d = parsed.data;
    await db.update(interactions).set({
      type: d.type,
      question: d.question,
      options: JSON.stringify(d.options),
      correctAnswer: normalizeCorrect(d.type, d.correctAnswer),
      timeLimitSeconds: d.timeLimitSeconds,
      category: d.category || '',
    }).where(eq(interactions.id, idP.data.id));
    return reply.send({ success: true });
  });

  // DELETE /api/admin/interactions/:id
  app.delete('/api/admin/interactions/:id', { preHandler: adminGuard }, async (request, reply) => {
    const idP = z.object({ id: z.coerce.number().int().positive() }).safeParse(request.params);
    if (!idP.success) return reply.status(400).send({ error: 'Invalid id' });
    await db.delete(interactions).where(eq(interactions.id, idP.data.id));
    return reply.send({ success: true });
  });

  // POST /api/admin/interactions/:id/duplicate
  app.post('/api/admin/interactions/:id/duplicate', { preHandler: adminGuard }, async (request, reply) => {
    const idP = z.object({ id: z.coerce.number().int().positive() }).safeParse(request.params);
    if (!idP.success) return reply.status(400).send({ error: 'Invalid id' });
    const orig = await db.select().from(interactions).where(eq(interactions.id, idP.data.id)).get();
    if (!orig) return reply.status(404).send({ error: 'Interaction not found' });
    const [row] = await db.insert(interactions).values({
      type: orig.type,
      question: `${orig.question} (cópia)`,
      options: orig.options,
      correctAnswer: orig.correctAnswer,
      timeLimitSeconds: orig.timeLimitSeconds,
      category: orig.category,
      createdBy: request.user!.userId,
    }).returning();
    return reply.status(201).send({ interaction: { ...row, options: JSON.parse(row.options) } });
  });

  // ─── CONTROLE DO PROFESSOR (admin, dentro da aula) ─────────────────────────

  // GET /api/admin/live-sessions/:id/interactions — ativações da sessão + nº de respostas
  app.get('/api/admin/live-sessions/:id/interactions', { preHandler: adminGuard }, async (request, reply) => {
    const idP = z.object({ id: z.coerce.number().int().positive() }).safeParse(request.params);
    if (!idP.success) return reply.status(400).send({ error: 'Invalid session id' });
    const rows = await db
      .select({
        id: sessionInteractions.id,
        interactionId: sessionInteractions.interactionId,
        status: sessionInteractions.status,
        orderIndex: sessionInteractions.orderIndex,
        type: interactions.type,
        question: interactions.question,
        options: interactions.options,
        timeLimitSeconds: interactions.timeLimitSeconds,
        responseCount: sql<number>`(SELECT COUNT(*) FROM interaction_responses ir WHERE ir.session_interaction_id = ${sessionInteractions.id})`,
      })
      .from(sessionInteractions)
      .innerJoin(interactions, eq(interactions.id, sessionInteractions.interactionId))
      .where(eq(sessionInteractions.sessionId, idP.data.id))
      .orderBy(asc(sessionInteractions.orderIndex), asc(sessionInteractions.id));
    return reply.send({
      items: rows.map((r) => ({ ...r, options: JSON.parse(r.options) })),
    });
  });

  // POST /api/admin/live-sessions/:id/interactions — anexa uma interação (pending)
  app.post('/api/admin/live-sessions/:id/interactions', { preHandler: adminGuard }, async (request, reply) => {
    const idP = z.object({ id: z.coerce.number().int().positive() }).safeParse(request.params);
    if (!idP.success) return reply.status(400).send({ error: 'Invalid session id' });
    const body = z.object({ interactionId: z.number().int().positive() }).safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: 'Invalid body' });

    const session = await db.select({ id: liveSessions.id }).from(liveSessions).where(eq(liveSessions.id, idP.data.id)).get();
    if (!session) return reply.status(404).send({ error: 'Session not found' });
    const inter = await db.select({ id: interactions.id }).from(interactions).where(eq(interactions.id, body.data.interactionId)).get();
    if (!inter) return reply.status(404).send({ error: 'Interaction not found' });

    const maxOrder = await db
      .select({ m: sql<number>`COALESCE(MAX(${sessionInteractions.orderIndex}), -1)` })
      .from(sessionInteractions)
      .where(eq(sessionInteractions.sessionId, idP.data.id))
      .get();

    const [row] = await db.insert(sessionInteractions).values({
      sessionId: idP.data.id,
      interactionId: body.data.interactionId,
      status: 'pending',
      orderIndex: (maxOrder?.m ?? -1) + 1,
    }).returning();
    return reply.status(201).send({ sessionInteraction: row });
  });

  // POST /api/admin/session-interactions/:siId/open — libera (fecha qualquer outra aberta na sessão)
  app.post('/api/admin/session-interactions/:siId/open', { preHandler: adminGuard }, async (request, reply) => {
    const idP = z.object({ siId: z.coerce.number().int().positive() }).safeParse(request.params);
    if (!idP.success) return reply.status(400).send({ error: 'Invalid id' });
    const si = await db.select().from(sessionInteractions).where(eq(sessionInteractions.id, idP.data.siId)).get();
    if (!si) return reply.status(404).send({ error: 'Not found' });

    // Só uma interação aberta por vez: fecha as demais da sessão
    await db.update(sessionInteractions)
      .set({ status: 'closed', closedAt: new Date() })
      .where(and(eq(sessionInteractions.sessionId, si.sessionId), eq(sessionInteractions.status, 'open')));

    await db.update(sessionInteractions)
      .set({ status: 'open', openedAt: new Date(), closedAt: null })
      .where(eq(sessionInteractions.id, idP.data.siId));
    return reply.send({ success: true });
  });

  // POST /api/admin/session-interactions/:siId/close
  app.post('/api/admin/session-interactions/:siId/close', { preHandler: adminGuard }, async (request, reply) => {
    const idP = z.object({ siId: z.coerce.number().int().positive() }).safeParse(request.params);
    if (!idP.success) return reply.status(400).send({ error: 'Invalid id' });
    await db.update(sessionInteractions)
      .set({ status: 'closed', closedAt: new Date() })
      .where(eq(sessionInteractions.id, idP.data.siId));
    return reply.send({ success: true });
  });

  // DELETE /api/admin/session-interactions/:siId
  app.delete('/api/admin/session-interactions/:siId', { preHandler: adminGuard }, async (request, reply) => {
    const idP = z.object({ siId: z.coerce.number().int().positive() }).safeParse(request.params);
    if (!idP.success) return reply.status(400).send({ error: 'Invalid id' });
    await db.delete(sessionInteractions).where(eq(sessionInteractions.id, idP.data.siId));
    return reply.send({ success: true });
  });

  // GET /api/admin/session-interactions/:siId/stats — estatística ao vivo (polling do professor)
  app.get('/api/admin/session-interactions/:siId/stats', { preHandler: adminGuard }, async (request, reply) => {
    const idP = z.object({ siId: z.coerce.number().int().positive() }).safeParse(request.params);
    if (!idP.success) return reply.status(400).send({ error: 'Invalid id' });

    const si = await db
      .select({
        status: sessionInteractions.status,
        type: interactions.type,
        options: interactions.options,
        correctAnswer: interactions.correctAnswer,
      })
      .from(sessionInteractions)
      .innerJoin(interactions, eq(interactions.id, sessionInteractions.interactionId))
      .where(eq(sessionInteractions.id, idP.data.siId))
      .get();
    if (!si) return reply.status(404).send({ error: 'Not found' });

    const responses = await db
      .select({ answer: interactionResponses.answer, isCorrect: interactionResponses.isCorrect, responseMs: interactionResponses.responseMs })
      .from(interactionResponses)
      .where(eq(interactionResponses.sessionInteractionId, idP.data.siId));

    const opts: string[] = JSON.parse(si.options);
    const counts = opts.map(() => 0);
    let correct = 0;
    let totalMs = 0;
    for (const r of responses) {
      if (r.answer >= 0 && r.answer < counts.length) counts[r.answer]++;
      if (r.isCorrect) correct++;
      totalMs += r.responseMs || 0;
    }
    const total = responses.length;
    return reply.send({
      status: si.status,
      type: si.type,
      total,
      counts,
      correctAnswer: si.correctAnswer,
      correctCount: correct,
      accuracy: total ? Math.round((correct / total) * 100) : 0,
      avgResponseMs: total ? Math.round(totalMs / total) : 0,
    });
  });

  // ─── ALUNO (público — polling) ─────────────────────────────────────────────

  // GET /api/live-sessions/:id/active-interaction — interação aberta agora (sem a resposta correta)
  app.get('/api/live-sessions/:id/active-interaction', async (request, reply) => {
    const idP = z.object({ id: z.coerce.number().int().positive() }).safeParse(request.params);
    if (!idP.success) return reply.status(400).send({ error: 'Invalid session id' });
    const row = await db
      .select({
        sessionInteractionId: sessionInteractions.id,
        openedAt: sessionInteractions.openedAt,
        type: interactions.type,
        question: interactions.question,
        options: interactions.options,
        timeLimitSeconds: interactions.timeLimitSeconds,
      })
      .from(sessionInteractions)
      .innerJoin(interactions, eq(interactions.id, sessionInteractions.interactionId))
      .where(and(eq(sessionInteractions.sessionId, idP.data.id), eq(sessionInteractions.status, 'open')))
      .orderBy(desc(sessionInteractions.openedAt))
      .get();

    if (!row) return reply.send({ active: null });
    return reply.send({
      active: {
        sessionInteractionId: row.sessionInteractionId,
        type: row.type,
        question: row.question,
        options: JSON.parse(row.options),
        timeLimitSeconds: row.timeLimitSeconds,
        openedAt: row.openedAt,
      },
    });
  });

  // POST /api/session-interactions/:siId/respond — registra a resposta do aluno
  app.post('/api/session-interactions/:siId/respond', async (request, reply) => {
    const idP = z.object({ siId: z.coerce.number().int().positive() }).safeParse(request.params);
    if (!idP.success) return reply.status(400).send({ error: 'Invalid id' });
    const parsed = respondSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid body', details: parsed.error.flatten() });

    const si = await db
      .select({
        status: sessionInteractions.status,
        type: interactions.type,
        correctAnswer: interactions.correctAnswer,
      })
      .from(sessionInteractions)
      .innerJoin(interactions, eq(interactions.id, sessionInteractions.interactionId))
      .where(eq(sessionInteractions.id, idP.data.siId))
      .get();
    if (!si) return reply.status(404).send({ error: 'Not found' });
    if (si.status !== 'open') return reply.status(409).send({ error: 'closed' });

    const isCorrect = si.type === 'poll' ? null : parsed.data.answer === si.correctAnswer;

    // Antifraude: índice único impede resposta dupla por participante
    await db.insert(interactionResponses).values({
      sessionInteractionId: idP.data.siId,
      participantName: parsed.data.participantName,
      answer: parsed.data.answer,
      isCorrect,
      responseMs: parsed.data.responseMs,
    }).onConflictDoNothing();

    return reply.send({
      ok: true,
      isCorrect,
      correctAnswer: si.type === 'poll' ? null : si.correctAnswer,
    });
  });
}
