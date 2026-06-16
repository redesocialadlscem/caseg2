import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { client } from './index.js';

/**
 * Cria as tabelas do fórum a partir de forum-migration.sql.
 * Idempotente (CREATE TABLE/INDEX IF NOT EXISTS).
 *
 *   node --import tsx src/server/db/migrate-forum.ts
 */
async function migrate() {
  console.log('🔧 Criando tabelas do fórum...');

  const here = path.dirname(fileURLToPath(import.meta.url));
  const sql = readFileSync(path.join(here, 'forum-migration.sql'), 'utf-8');

  const statements = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--')) // remove comentários
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await client.execute(stmt);
  }

  console.log(`✅ Fórum: ${statements.length} statements aplicados.`);
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erro na migração do fórum:', err);
    process.exit(1);
  });
