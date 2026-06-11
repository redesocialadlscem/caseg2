import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { settings } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

// ─── Schemas Zod ─────────────────────────────────────────────────────────────
const updateSettingsSchema = z.object({
  siteName: z.string().min(1).optional(),
  siteLogo: z.string().optional(),
  tagline: z.string().optional(),
  contactEmail: z.string().email().optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().optional(),
  allowRegistration: z.boolean().optional(),
  maxUploadSizeMb: z.number().int().positive().optional(),
  // Security
  tokenExpiration: z.string().optional(),
  requireEmailVerification: z.boolean().optional(),
  maxLoginAttempts: z.number().int().positive().optional(),
  // Notifications
  welcomeEmail: z.boolean().optional(),
  notifyAdminNewUser: z.boolean().optional(),
  emailTemplate: z.string().optional(),
});

// ─── Default settings ────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: Record<string, unknown> = {
  siteName: 'CASEG2 - Plataforma de Cursos SST',
  siteLogo: '/logo-caseg.png',
  tagline: 'Plataforma líder em cursos de segurança e conformidade NR.',
  contactEmail: 'contato@caseg2.com.br',
  maintenanceMode: false,
  maintenanceMessage: 'Estamos realizando manutenção programada. Voltaremos em breve!',
  allowRegistration: true,
  maxUploadSizeMb: 10,
  // Security
  tokenExpiration: '1h',
  requireEmailVerification: false,
  maxLoginAttempts: 5,
  // Notifications
  welcomeEmail: true,
  notifyAdminNewUser: true,
  emailTemplate: 'Olá {{name}},\n\nBem-vindo à CASEG! Sua conta foi criada com sucesso.\n\nAtenciosamente,\nEquipe CASEG',
};

// ─── Admin guard helper ──────────────────────────────────────────────────────
function isAdmin(request: any): boolean {
  return request.user?.role === 'admin';
}

// ─── Helper: get all settings as object ──────────────────────────────────────
async function getAllSettings(): Promise<Record<string, unknown>> {
  try {
    const rows = await db.select().from(settings);
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }

    // Helper to parse stored string values back to correct types
    const getBool = (key: string, fallback: boolean) => {
      if (result[key] === undefined) return fallback;
      return result[key] === 'true';
    };
    const getNum = (key: string, fallback: number) => {
      if (result[key] === undefined) return fallback;
      const n = Number(result[key]);
      return isNaN(n) ? fallback : n;
    };
    const getStr = (key: string, fallback: string) => result[key] ?? fallback;

    return {
      siteName: getStr('siteName', DEFAULT_SETTINGS.siteName as string),
      siteLogo: getStr('siteLogo', DEFAULT_SETTINGS.siteLogo as string),
      tagline: getStr('tagline', DEFAULT_SETTINGS.tagline as string),
      contactEmail: getStr('contactEmail', DEFAULT_SETTINGS.contactEmail as string),
      maintenanceMode: getBool('maintenanceMode', DEFAULT_SETTINGS.maintenanceMode as boolean),
      maintenanceMessage: getStr('maintenanceMessage', DEFAULT_SETTINGS.maintenanceMessage as string),
      allowRegistration: getBool('allowRegistration', DEFAULT_SETTINGS.allowRegistration as boolean),
      maxUploadSizeMb: getNum('maxUploadSizeMb', DEFAULT_SETTINGS.maxUploadSizeMb as number),
      tokenExpiration: getStr('tokenExpiration', DEFAULT_SETTINGS.tokenExpiration as string),
      requireEmailVerification: getBool('requireEmailVerification', DEFAULT_SETTINGS.requireEmailVerification as boolean),
      maxLoginAttempts: getNum('maxLoginAttempts', DEFAULT_SETTINGS.maxLoginAttempts as number),
      welcomeEmail: getBool('welcomeEmail', DEFAULT_SETTINGS.welcomeEmail as boolean),
      notifyAdminNewUser: getBool('notifyAdminNewUser', DEFAULT_SETTINGS.notifyAdminNewUser as boolean),
      emailTemplate: getStr('emailTemplate', DEFAULT_SETTINGS.emailTemplate as string),
    };
  } catch {
    // Table might not exist yet or be empty — return defaults
    return { ...DEFAULT_SETTINGS };
  }
}

// ─── Public helper (exported for use in index.ts) ───────────────────────────
export { getAllSettings };

// ─── Routes ──────────────────────────────────────────────────────────────────
export async function adminSettingsRoutes(app: FastifyInstance) {
  // All routes below require auth + admin role
  app.addHook('preHandler', async (request, reply) => {
    await authMiddleware(request, reply);
    if (reply.sent) return;
    if (!isAdmin(request)) {
      return reply.status(403).send({ error: 'Admin access required' });
    }
  });

  // GET /api/admin/settings — retornar todas as configurações
  app.get('/api/admin/settings', async (_request, reply) => {
    try {
      const currentSettings = await getAllSettings();
      return reply.send(currentSettings);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch settings' });
    }
  });

  // PUT /api/admin/settings — atualizar configurações (upsert key/value)
  app.put('/api/admin/settings', async (request, reply) => {
    const parsed = updateSettingsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
    }

    if (Object.keys(parsed.data).length === 0) {
      return reply.status(400).send({ error: 'At least one setting must be provided' });
    }

    try {
      // Upsert each setting
      for (const [key, value] of Object.entries(parsed.data)) {
        if (value === undefined) continue;

        const stringValue = String(value);

        // Try update first
        const updated = await db.update(settings)
          .set({ value: stringValue })
          .where(eq(settings.key, key))
          .returning();

        // If no row was updated, insert
        if (updated.length === 0) {
          await db.insert(settings)
            .values({ key, value: stringValue })
            .onConflictDoNothing();
        }
      }

      // Return updated settings
      const currentSettings = await getAllSettings();
      return reply.send(currentSettings);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to update settings' });
    }
  });
}
