import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const c = createClient({ url: 'file:/home/ubuntu/caseg2/caseg2/data/app.db' });
const hash = await bcrypt.hash('Admin@2026!', 10);
await c.execute({ sql: 'UPDATE users SET password_hash = ? WHERE email = ?', args: [hash, 'turnner@test.com'] });
console.log('PASSWORD RESET OK for turnner@test.com');
process.exit();
