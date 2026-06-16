import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { desc, eq, sql, and } from 'drizzle-orm';
// archiver is CJS — use createRequire for ESM compatibility (Node 24+)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const archiver: (...args: any[]) => any = require('archiver');
import { db } from '../db/index.js';
import { liveSessions, liveSessionParticipants, users } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateCertificatePdf } from '../lib/certificatePdf.js';
import { generateJaasToken } from '../lib/jaas.js';
import { computeSessionAnalytics } from './interactions.js';

// ─── Schemas Zod ─────────────────────────────────────────────────────────────
const createSessionSchema = z.object({
  title: z.string().min(1),
  courseName: z.string().min(1),
  companyCode: z.string().min(1),
  scheduledAt: z.coerce.date(),
  durationMinutes: z.coerce.number().int().positive().default(60),
});

const updateStatusSchema = z.object({
  status: z.enum(['scheduled', 'live', 'completed', 'cancelled']),
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const accessSchema = z.object({
  companyCode: z.string().min(1),
  employeeName: z.string().min(1),
});

const completeSchema = z.object({
  employeeName: z.string().min(1),
  companyCode: z.string().min(1),
  force: z.boolean().optional().default(false), // ignora o gate de certificação
});

// ─── Admin guard helper ──────────────────────────────────────────────────────
function isAdmin(request: any): boolean {
  return request.user?.role === 'admin';
}

// ─── Routes ──────────────────────────────────────────────────────────────────
export async function adminLiveSessionRoutes(app: FastifyInstance) {
  // All routes below require auth + admin role
  app.addHook('preHandler', async (request, reply) => {
    await authMiddleware(request, reply);
    if (reply.sent) return;
    if (!isAdmin(request)) {
      return reply.status(403).send({ error: 'Admin access required' });
    }
  });

  // GET /api/admin/live-sessions/:id/jaas-token — token de MODERADOR (admin) para a sala
  app.get('/api/admin/live-sessions/:id/jaas-token', async (request, reply) => {
    const idParam = idParamSchema.safeParse(request.params);
    if (!idParam.success) {
      return reply.status(400).send({ error: 'Invalid session id' });
    }
    const session = await db.select().from(liveSessions).where(eq(liveSessions.id, idParam.data.id)).get();
    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }
    const me = await db.select({ name: users.name }).from(users).where(eq(users.id, request.user!.userId)).get();
    const result = await generateJaasToken({
      room: session.jitsiRoom,
      name: me?.name || request.user!.email,
      email: request.user!.email,
      userId: String(request.user!.userId),
      moderator: true,
    });
    return reply.send({ token: result?.token ?? null, appId: result?.appId ?? null });
  });

  // GET /api/admin/live-sessions — listar todas as sessões
  app.get('/api/admin/live-sessions', async (_request, reply) => {
    try {
      const sessions = await db.select().from(liveSessions).orderBy(desc(liveSessions.scheduledAt));
      return reply.send({ sessions });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch live sessions' });
    }
  });

  // GET /api/admin/live-sessions/:id — buscar sessão individual
  app.get('/api/admin/live-sessions/:id', async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid session id' });
    }

    try {
      const session = await db.select()
        .from(liveSessions)
        .where(eq(liveSessions.id, params.data.id))
        .get();

      if (!session) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      return reply.send(session);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch session' });
    }
  });

  // POST /api/admin/live-sessions — criar nova sessão
  app.post('/api/admin/live-sessions', async (request, reply) => {
    const parsed = createSessionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
    }

    try {
      const inserted = await db.insert(liveSessions)
        .values({
          title: parsed.data.title,
          courseName: parsed.data.courseName,
          companyCode: parsed.data.companyCode.toUpperCase(),
          scheduledAt: parsed.data.scheduledAt,
          durationMinutes: parsed.data.durationMinutes,
          jitsiRoom: '', // será preenchido após insert com o ID
        })
        .returning();

      if (inserted.length === 0) {
        return reply.status(500).send({ error: 'Failed to create session' });
      }

      // Gerar jitsiRoom com o ID da sessão
      const jitsiRoom = `CASEG2-${inserted[0].id}-${Date.now()}`;
      await db.update(liveSessions)
        .set({ jitsiRoom })
        .where(eq(liveSessions.id, inserted[0].id));

      return reply.status(201).send({ ...inserted[0], jitsiRoom });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to create live session' });
    }
  });

  // PATCH /api/admin/live-sessions/:id/status — mudar status
  app.patch('/api/admin/live-sessions/:id/status', async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid session id' });
    }

    const parsed = updateStatusSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
    }

    try {
      const updated = await db.update(liveSessions)
        .set({ status: parsed.data.status })
        .where(eq(liveSessions.id, params.data.id))
        .returning();

      if (updated.length === 0) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      return reply.send(updated[0]);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to update session status' });
    }
  });

  // GET /api/admin/live-sessions/:id/participants — listar participantes
  app.get('/api/admin/live-sessions/:id/participants', async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid session id' });
    }

    try {
      const participants = await db.select()
        .from(liveSessionParticipants)
        .where(eq(liveSessionParticipants.sessionId, params.data.id))
        .orderBy(desc(liveSessionParticipants.joinedAt));

      return reply.send({ participants });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch participants' });
    }
  });

  // POST /api/admin/live-sessions/:id/complete — marcar participante como concluído
  app.post('/api/admin/live-sessions/:id/complete', async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid session id' });
    }

    const parsed = completeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
    }

    try {
      // Gate de certificação (5.5): se a aula tem regras configuradas e o aluno
      // não as cumpre, bloqueia a emissão (a menos que force=true).
      if (!parsed.data.force) {
        const analytics = await computeSessionAnalytics(params.data.id);
        const hasRules = analytics.certRules.minAttendancePct > 0
          || analytics.certRules.minAttentionPct > 0
          || analytics.certRules.minResponsePct > 0;
        if (hasRules) {
          const aluno = analytics.alunos.find((a) => a.name === parsed.data.employeeName);
          if (aluno && !aluno.eligible) {
            return reply.status(409).send({
              error: 'certificate_blocked',
              message: 'Aluno não cumpre as regras de certificação desta aula.',
              blockedBy: aluno.blockedBy,
            });
          }
        }
      }

      const updated = await db.update(liveSessionParticipants)
        .set({ completedAt: new Date(), certificateIssued: true })
        .where(
          and(
            eq(liveSessionParticipants.sessionId, params.data.id),
            eq(liveSessionParticipants.employeeName, parsed.data.employeeName),
            eq(liveSessionParticipants.companyCode, parsed.data.companyCode.toUpperCase()),
          )
        )
        .returning();

      if (updated.length === 0) {
        return reply.status(404).send({ error: 'Participant not found' });
      }

      return reply.send(updated[0]);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to complete session' });
    }
  });

  // GET /api/admin/live-sessions/:id/certificates/bulk-download — ZIP com PDFs
  app.get('/api/admin/live-sessions/:id/certificates/bulk-download', async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid session id' });
    }

    try {
      // Buscar sessão
      const session = await db.select()
        .from(liveSessions)
        .where(eq(liveSessions.id, params.data.id))
        .get();

      if (!session) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      // Buscar participantes com certificado emitido
      const participants = await db.select()
        .from(liveSessionParticipants)
        .where(
          and(
            eq(liveSessionParticipants.sessionId, params.data.id),
            eq(liveSessionParticipants.certificateIssued, true),
          )
        );

      if (participants.length === 0) {
        return reply.status(404).send({ error: 'Nenhum certificado emitido para esta aula.' });
      }

      // Criar ZIP stream
      const archive = archiver('zip', { zlib: { level: 6 } });
      const safeTitle = session.title.replace(/[^a-zA-Z0-9_-]/g, '_');

      reply.header('Content-Type', 'application/zip');
      reply.header('Content-Disposition', `attachment; filename="certificados_${safeTitle}.zip"`);

      // Gerar PDFs e adicionar ao ZIP
      for (const p of participants) {
        const pdfBuffer = await generateCertificatePdf({
          employeeName: p.employeeName,
          companyCode: p.companyCode,
          sessionTitle: session.title,
          courseName: session.courseName,
          completedAt: p.completedAt?.toISOString() ?? new Date().toISOString(),
          durationMinutes: session.durationMinutes,
        });

        const safeName = p.employeeName.replace(/[^a-zA-Z0-9áàâãéèêíïóôõúüçÁÀÂÃÉÈÊÍÏÓÔÕÚÜÇ\s-]/gi, '').replace(/\s+/g, '_');
        archive.append(pdfBuffer, { name: `${safeName}.pdf` });
      }

      archive.finalize();
      return reply.send(archive);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to generate certificates ZIP' });
    }
  });
}

// ─── Public route handler (exported for use in index.ts without auth) ────────
export async function handleLiveSessionAccess(app: FastifyInstance) {
  // POST /api/live-sessions/access — permite entrada em sessões 'scheduled' (sala de espera) ou 'live'
  app.post('/api/live-sessions/access', async (request, reply) => {
    const parsed = accessSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
    }

    try {
      // Buscar sessão com status 'live' OU 'scheduled' (sala de espera)
      const session = await db.select()
        .from(liveSessions)
        .where(
          and(
            eq(liveSessions.companyCode, parsed.data.companyCode.toUpperCase()),
            sql`${liveSessions.status} IN ('live', 'scheduled')`,
          )
        )
        .get();

      if (!session) {
        return reply.status(404).send({ error: 'Nenhuma aula ativa ou agendada encontrada para este código.' });
      }

      const waitingRoom = session.status === 'scheduled';

      // Verificar se já está registrado
      const existing = await db.select()
        .from(liveSessionParticipants)
        .where(
          and(
            eq(liveSessionParticipants.sessionId, session.id),
            eq(liveSessionParticipants.employeeName, parsed.data.employeeName),
            eq(liveSessionParticipants.companyCode, parsed.data.companyCode.toUpperCase()),
          )
        )
        .get();

      if (existing) {
        return reply.send({
          sessionId: session.id,
          jitsiRoom: session.jitsiRoom,
          participantName: existing.employeeName,
          waitingRoom,
        });
      }

      // Registrar novo participante
      await db.insert(liveSessionParticipants).values({
        sessionId: session.id,
        employeeName: parsed.data.employeeName,
        companyCode: parsed.data.companyCode.toUpperCase(),
      });

      return reply.send({
        sessionId: session.id,
        jitsiRoom: session.jitsiRoom,
        participantName: parsed.data.employeeName,
        waitingRoom,
      });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to access live session' });
    }
  });

  // GET /api/live-sessions/:id/status — polling público para sala de espera (sem auth)
  app.get('/api/live-sessions/:id/status', async (request, reply) => {
    const idParam = z.object({ id: z.coerce.number().int().positive() }).safeParse((request.params as any));
    if (!idParam.success) {
      return reply.status(400).send({ error: 'Invalid session id' });
    }

    try {
      const session = await db.select({
        status: liveSessions.status,
        jitsiRoom: liveSessions.jitsiRoom,
        title: liveSessions.title,
        durationMinutes: liveSessions.durationMinutes,
      })
        .from(liveSessions)
        .where(eq(liveSessions.id, idParam.data.id))
        .get();

      if (!session) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      return reply.send({
        status: session.status,
        jitsiRoom: session.jitsiRoom,
        title: session.title,
        durationMinutes: session.durationMinutes,
      });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch session status' });
    }
  });

  // POST /api/live-sessions/:id/jaas-token — token de PARTICIPANTE (aluno, sem moderador)
  app.post('/api/live-sessions/:id/jaas-token', async (request, reply) => {
    const idParam = z.object({ id: z.coerce.number().int().positive() }).safeParse(request.params);
    if (!idParam.success) {
      return reply.status(400).send({ error: 'Invalid session id' });
    }
    const body = z.object({ name: z.string().min(1).max(120).optional() }).safeParse(request.body ?? {});
    const name = (body.success && body.data.name) ? body.data.name : 'Participante';

    const session = await db.select().from(liveSessions).where(eq(liveSessions.id, idParam.data.id)).get();
    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }
    const result = await generateJaasToken({
      room: session.jitsiRoom,
      name,
      moderator: false,
    });
    return reply.send({ token: result?.token ?? null, appId: result?.appId ?? null });
  });
}
