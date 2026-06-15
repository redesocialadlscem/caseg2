import 'dotenv/config';
// restart trigger
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { authRoutes } from './routes/auth.js';
import { courseRoutes } from './routes/courses.js';
import { progressRoutes } from './routes/progress.js';
import { certificateRoutes } from './routes/certificates.js';
import { adminCourseRoutes } from './routes/adminCourses.js';
import { adminUserRoutes } from './routes/adminUsers.js';
import { adminNewsRoutes } from './routes/adminNews.js';
import { adminSettingsRoutes, getAllSettings } from './routes/adminSettings.js';
import { adminDashboardRoutes } from './routes/adminDashboard.js';
import { adminLiveSessionRoutes, handleLiveSessionAccess } from './routes/adminLiveSessions.js';
import { adminCertificateRoutes } from './routes/adminCertificates.js';
import { newsRoutes } from './routes/news.js';
import { paymentRoutes } from './routes/payments.js';
import { evaluationsRoutes } from './routes/evaluations.js';
import { forumRoutes } from './routes/forum.js';

const app = Fastify({ logger: true });

async function start() {
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  // Register routes
  await app.register(authRoutes);
  await app.register(courseRoutes);
  await app.register(progressRoutes);
  await app.register(certificateRoutes);
  await app.register(adminCourseRoutes);
  await app.register(adminUserRoutes);
  await app.register(adminNewsRoutes);
  await app.register(adminSettingsRoutes);
  await app.register(adminDashboardRoutes);
  await app.register(adminLiveSessionRoutes);
  await app.register(adminCertificateRoutes);
  await app.register(newsRoutes);
  await app.register(paymentRoutes);
  await app.register(evaluationsRoutes);
  await app.register(forumRoutes);

  // Public endpoints (no auth required)
  await handleLiveSessionAccess(app);

  // Public settings endpoint
  app.get('/api/settings/public', async (_request, reply) => {
    try {
      const all = await getAllSettings();
      return reply.send({
        siteName: all.siteName,
        siteLogo: all.siteLogo,
      });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch public settings' });
    }
  });

  // Health check
  app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  const port = Number(process.env.PORT) || 3050;
  const host = process.env.HOST || '0.0.0.0';

  try {
    await app.listen({ port, host });
    console.log(`🚀 Server running at http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
