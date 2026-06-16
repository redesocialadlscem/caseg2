import { client } from './index.js';

/**
 * Migração das tabelas de Aula Interativa (Fase 5 — banco de interações,
 * ativações na aula e respostas). Idempotente.
 *
 *   node --import tsx src/server/db/migrate-interactions.ts
 */
async function migrate() {
  console.log('🔧 Criando tabelas de interações...');

  await client.execute(`
    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      question TEXT NOT NULL,
      options TEXT NOT NULL DEFAULT '[]',
      correct_answer INTEGER,
      time_limit_seconds INTEGER NOT NULL DEFAULT 20,
      category TEXT NOT NULL DEFAULT '',
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS session_interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
      interaction_id INTEGER NOT NULL REFERENCES interactions(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      order_index INTEGER NOT NULL DEFAULT 0,
      opened_at INTEGER,
      closed_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS interaction_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_interaction_id INTEGER NOT NULL REFERENCES session_interactions(id) ON DELETE CASCADE,
      participant_name TEXT NOT NULL,
      answer INTEGER NOT NULL,
      is_correct INTEGER,
      response_ms INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);

  await client.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS interaction_responses_unique
      ON interaction_responses (session_interaction_id, participant_name)
  `);

  console.log('✅ Tabelas de interações criadas com sucesso!');
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erro na migração:', err);
    process.exit(1);
  });
