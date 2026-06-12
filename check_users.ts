import { createClient } from '@libsql/client';
const c = createClient({ url: 'file:data/app.db' });
const r = await c.execute('SELECT id, email, name, role FROM users');
console.log(JSON.stringify(r.rows, null, 2));
c.close();
