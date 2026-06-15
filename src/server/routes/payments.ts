import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { courses } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

// Aceita tanto { courseId } (single) quanto { courseIds } (cart)
const createPreferenceSchema = z.object({
  courseId: z.string().optional(),
  courseIds: z.array(z.string()).min(1).optional(),
}).refine(data => data.courseId || (data.courseIds && data.courseIds.length > 0), {
  message: 'Either courseId or courseIds must be provided',
});

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

      const protocol = request.protocol;
      const host = request.headers.host || 'localhost:5173';
      const baseUrl = `${protocol}://${host}`;

      const mpItems = activeCourses.map(course => ({
        id: String(course.id),
        title: course.title,
        description: course.description || undefined,
        quantity: 1,
        unit_price: Number(course.price) || 0,
        currency_id: 'BRL',
      }));

      const externalRef = parsed.data.courseIds
        ? { courseIds: activeCourses.map(c => c.id), userId }
        : { courseId: activeCourses[0].id, userId };

      const response = await preference.create({
        body: {
          items: mpItems,
          payer: {
            email: request.user?.email,
          },
          external_reference: JSON.stringify(externalRef),
          back_urls: {
            success: `${baseUrl}/payment/success`,
            pending: `${baseUrl}/payment/pending`,
            failure: `${baseUrl}/payment/failure`,
          },
          auto_return: 'approved',
          notification_url: `${protocol}://${host.replace(/:\d+$/, '')}:3050/api/payments/webhook`,
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
  app.post('/api/payments/webhook', async (request, reply) => {
    // Sempre retorna 200 pro MP não ficar reenviando
    // O processamento real será implementado quando tivermos tabela de pagamentos
    app.log.info({ webhook: request.body }, 'MP Webhook received');
    return reply.status(200).send({ received: true });
  });
}
