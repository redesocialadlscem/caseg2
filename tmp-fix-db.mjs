import { createClient } from '@libsql/client';
const c = createClient({ url: 'file:/home/ubuntu/caseg2/caseg2/data/app.db' });
try {
  await c.execute('ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1');
  console.log('COLUMN is_active ADDED');
} catch(e) {
  console.log('SKIP:', e.message);
}
const r = await c.execute('PRAGMA table_info(users)');
console.log('SCHEMA:', JSON.stringify(r.rows.map(x => x.name)));
process.exit();
