import { createClient } from '@libsql/client';

async function main() {
  const db = createClient({ url: 'file:data/app.db' });
  const r = await db.execute('PRAGMA table_info(users)');
  console.log(JSON.stringify(r.rows, null, 2));
  db.close();
}

main().catch(console.error);
