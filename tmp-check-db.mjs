import { createClient } from '@libsql/client';
const c = createClient({ url: 'file:/home/ubuntu/caseg2/caseg2/data/app.db' });
try {
  const tables = await c.execute("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('TABLES:', JSON.stringify(tables.rows));
  const schema = await c.execute('PRAGMA table_info(users)');
  console.log('USERS_SCHEMA:', JSON.stringify(schema.rows));
} catch(e) {
  console.error('ERROR:', e.message);
}
process.exit();
