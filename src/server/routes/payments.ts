import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import crypto from 'node:crypto';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { courses, payments } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { ensureEnrollment } from '../lib/enrollment.js';

// Aceita tanto { courseId } (single) quanto { courseIds } (cart)
const createPreferenceSchema = z.object({
  courseId: z.string().optional(),
  courseIds: z.array(z.string()).min(1).optional(),
}).refine(data => data.courseId || (data.courseIds && data.courseIds.length > 0), {
  message: 'Either courseId or courseIds must be provided',
});

interface ExternalRef {
  courseIds: number[];
  userId: number;
}

/**
 * Verifica a assinatura do webhook do Mercado Pago.
 * MP envia o header `x-signature: ts=<ts>,v1=<hash>` + `x-request-id`.
 * O manifesto assinado é `id:<dataId>;request-id:<reqId>;ts:<ts>;`.
 * Retorna true se válida — ou se não há segredo configurado (modo dev).
 */
function verifyWebhookSignature(
  signatureHeader: string | undefined,
  requestId: string | undefined,
  dataId: string | undefined,
): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  // Sem segredo configurado: não bloqueia (dev), mas o handler loga um aviso.
  if (!secret) return true;
  if (!signatureHeader || !dataId) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(',').map(kv => {
      const [k, v] = kv.split('=');
      return [k?.trim(), v?.trim()];
    }),
  );
  const ts = parts['ts'];
  const v1 = parts['v1'];
  if (!ts || !v1) return false;

  // dataId alfanumérico deve ser minúsculo no manifesto
  const normalizedId = /^[a-zA-Z0-9]+$/.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifest = `id:${normalizedId};request-id:${requestId || ''};ts:${ts};`;
  const computed = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(v1));
  } catch {
    return false;
  }
}

export async function paymentRoutes(app: FastifyInstance) {
  // POST /api/payments/create-preference — cria preferência de pagamento no MP
  app.post('/api/payments/create-preference', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const parsed = createPreferenceSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
    }

    const userId = request.user?.userId;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    // Normaliza para array de IDs
    const ids = parsed.data.courseIds
      ? parsed.data.courseIds.map(Number)
      : [Number(parsed.data.courseId!)];

    // Busca todos os cursos ativos
    const foundCourses = await db.select().from(courses)
      .where(inArray(courses.id, ids))
      .all();

    const activeCourses = foundCourses.filter(c => c.isActive);
    if (activeCourses.length === 0) {
      return reply.status(404).send({ error: 'No active courses found' });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      app.log.error('MP_ACCESS_TOKEN not configured');
      return reply.status(500).send({ error: 'Payment gateway not configured' });
    }

    try {
      const client = new MercadoPagoConfig({ accessToken });
      const preference = new Preference(client);

      // URLs configuráveis por env (em prod o host do request é o da API, não do front).
      const requestOrigin = `${request.protocol}://${request.headers.host || 'localhost:5173'}`;
      const webUrl = process.env.PUBLIC_WEB_URL || process.env.CORS_ORIGIN || requestOrigin;
      const apiUrl = process.env.PUBLIC_API_URL || requestOrigin;

      const mpItems = activeCourses.map(course => ({
        id: String(course.id),
        title: course.title,
        description: course.description || undefined,
        quantity: 1,
        unit_price: Number(course.price) || 0,
        currency_id: 'BRL',
      }));

      const externalRef: ExternalRef = {
        courseIds: activeCourses.map(c => c.id),
        userId,
      };

      const response = await preference.create({
        body: {
          items: mpItems,
          payer: {
            email: request.user?.email,
          },
          external_reference: JSON.stringify(externalRef),
          back_urls: {
            success: `${webUrl}/payment/success`,
            pending: `${webUrl}/payment/pending`,
            failure: `${webUrl}/payment/failure`,
          },
          auto_return: 'approved',
          notification_url: `${apiUrl}/api/payments/webhook`,
        },
      });

      return reply.send({
        init_point: response.init_point,
        sandbox_init_point: response.sandbox_init_point,
        id: response.id,
      });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to create payment preference' });
    }
  });

  // POST /api/payments/webhook — recebe notificações do MP (IPN)
  // Sempre responde 200 para o MP não reenviar; o processamento é idempotente.
  app.post('/api/payments/webhook', async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const body = (request.body ?? {}) as Record<string, any>;

    // O ID do pagamento pode vir na query (data.id) ou no corpo (data.id)
    const dataId = query['data.id'] || body?.data?.id || query['id'];
    const topic = query['type'] || query['topic'] || body?.type;

    const signatureOk = verifyWebhookSignature(
      request.headers['x-signature'] as string | undefined,
      request.headers['x-request-id'] as string | undefined,
      dataId ? String(dataId) : undefined,
    );

    if (!signatureOk) {
      app.log.warn({ dataId }, 'MP webhook: assinatura inválida — ignorado');
      return reply.status(200).send({ received: true, ignored: 'invalid_signature' });
    }
    if (!process.env.MP_WEBHOOK_SECRET) {
      app.log.warn('MP_WEBHOOK_SECRET não configurado — webhook sem verificação de assinatura');
    }

    // Só processamos notificações de pagamento
    if (topic && topic !== 'payment') {
      return reply.status(200).send({ received: true, ignored: topic });
    }
    if (!dataId) {
      return reply.status(200).send({ received: true, ignored: 'no_data_id' });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      app.log.error('MP_ACCESS_TOKEN não configurado — não é possível confirmar o pagamento');
      return reply.status(200).send({ received: true, ignored: 'gateway_not_configured' });
    }

    try {
      const client = new MercadoPagoConfig({ accessToken });
      const paymentApi = new Payment(client);
      const info = await paymentApi.get({ id: String(dataId) });

      const providerPaymentId = String(info.id);
      const status = info.status || 'unknown'; // approved | pending | rejected | ...
      const amount = Number(info.transaction_amount) || 0;

      let ref: ExternalRef | null = null;
      try {
        ref = info.external_reference ? JSON.parse(info.external_reference) : null;
      } catch {
        ref = null;
      }

      if (!ref || !ref.userId || !Array.isArray(ref.courseIds)) {
        app.log.warn({ providerPaymentId }, 'MP webhook: external_reference ausente/ inválido');
        return reply.status(200).send({ received: true, ignored: 'no_reference' });
      }

      // Registro idempotente do pagamento
      const existing = await db.select().from(payments)
        .where(eq(payments.providerPaymentId, providerPaymentId))
        .get();

      if (existing) {
        // Atualiza status; só concede acesso se ainda não estava aprovado
        const wasApproved = existing.status === 'approved';
        await db.update(payments)
          .set({ status, rawPayload: JSON.stringify(info), updatedAt: new Date() })
          .where(eq(payments.id, existing.id));

        if (status === 'approved' && !wasApproved) {
          await grantEnrollments(ref);
        }
        return reply.status(200).send({ received: true, paymentId: providerPaymentId, status });
      }

      await db.insert(payments).values({
        userId: ref.userId,
        provider: 'mercadopago',
        providerPaymentId,
        preferenceId: '',
        status,
        amount,
        courseIds: JSON.stringify(ref.courseIds),
        rawPayload: JSON.stringify(info),
      }).onConflictDoNothing();

      if (status === 'approved') {
        await grantEnrollments(ref);
      }

      return reply.status(200).send({ received: true, paymentId: providerPaymentId, status });
    } catch (error) {
      app.log.error(error, 'MP webhook: falha ao processar pagamento');
      // 200 mesmo assim para não cair em loop de reenvio; reprocessável manualmente.
      return reply.status(200).send({ received: true, error: 'processing_failed' });
    }
  });
}

/** Matricula o usuário em todos os cursos pagos da referência. */
async function grantEnrollments(ref: ExternalRef): Promise<void> {
  for (const courseId of ref.courseIds) {
    await ensureEnrollment(ref.userId, Number(courseId), 'purchase');
  }
}
