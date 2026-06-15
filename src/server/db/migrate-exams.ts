import { client } from './index.js';

async function migrate() {
  console.log('🔧 Criando tabelas de avaliações...');

  await client.execute(`
    CREATE TABLE IF NOT EXISTS exam_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer INTEGER NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer INTEGER NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS activity_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
      answers TEXT NOT NULL,
      score REAL NOT NULL DEFAULT 0,
      completed_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS exam_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      answers TEXT NOT NULL,
      score REAL NOT NULL DEFAULT 0,
      passed INTEGER NOT NULL DEFAULT 0,
      time_spent_seconds INTEGER NOT NULL DEFAULT 0,
      completed_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS lesson_configs (
      lesson_id INTEGER PRIMARY KEY REFERENCES lessons(id) ON DELETE CASCADE,
      has_activity INTEGER NOT NULL DEFAULT 0,
      has_exam INTEGER NOT NULL DEFAULT 0,
      exam_duration_minutes INTEGER NOT NULL DEFAULT 30,
      exam_passing_score REAL NOT NULL DEFAULT 70,
      activity_duration_minutes INTEGER NOT NULL DEFAULT 15
    )
  `);

  console.log('✅ Tabelas de avaliações criadas com sucesso!');
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erro na migração:', err);
    process.exit(1);
  });
