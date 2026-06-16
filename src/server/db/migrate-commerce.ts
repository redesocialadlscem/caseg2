import { client } from './index.js';

/**
 * Migração das tabelas de comércio (matrículas + pagamentos).
 * Idempotente: pode rodar várias vezes sem efeito colateral.
 *
 *   node --import tsx src/server/db/migrate-commerce.ts
 */
/** Adiciona uma coluna ignorando o erro "duplicate column" (idempotente). */
async function addColumnIfMissing(table: string, columnDef: string) {
  try {
    await client.execute(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
  } catch (e: any) {
    if (!e?.message?.includes('duplicate column')) throw e;
  }
}

async function migrate() {
  console.log('🔧 Criando tabelas de matrículas e pagamentos...');

  // Sincroniza colunas que tabelas antigas não tinham (schema drift).
  // A tabela `courses` legada não tinha image_url/is_featured/price.
  await addColumnIfMissing('courses', "image_url TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing('courses', "is_featured INTEGER NOT NULL DEFAULT 0");
  await addColumnIfMissing('courses', "price REAL NOT NULL DEFAULT 0");
  // SQLite não aceita DEFAULT não-constante em ALTER ADD COLUMN NOT NULL:
  // adiciona nullable e faz backfill com created_at (ou agora).
  await addColumnIfMissing('courses', "updated_at INTEGER");
  await client.execute("UPDATE courses SET updated_at = COALESCE(updated_at, created_at, unixepoch())");
  await addColumnIfMissing('users', "is_active INTEGER NOT NULL DEFAULT 1");

  // Conformidade NR
  await addColumnIfMissing('users', "cpf TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing('courses', "nr_reference TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing('courses', "validity_months INTEGER NOT NULL DEFAULT 0");
  await addColumnIfMissing('courses', "instructor_name TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing('courses', "instructor_title TEXT NOT NULL DEFAULT ''");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      source TEXT NOT NULL DEFAULT 'purchase',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);

  // Garante que um aluno só tenha uma matrícula por curso
  await client.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS enrollments_user_course_unique
      ON enrollments (user_id, course_id)
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL DEFAULT 'mercadopago',
      provider_payment_id TEXT NOT NULL UNIQUE,
      preference_id TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      amount REAL NOT NULL DEFAULT 0,
      course_ids TEXT NOT NULL DEFAULT '[]',
      raw_payload TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);

  console.log('✅ Tabelas de comércio criadas com sucesso!');
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erro na migração:', err);
    process.exit(1);
  });
