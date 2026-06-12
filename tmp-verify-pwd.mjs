import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const c = createClient({ url: 'file:/home/ubuntu/caseg2/caseg2/data/app.db' });
const result = await c.execute({ sql: 'SELECT email, password_hash, role, is_active FROM users WHERE email = ?', args: ['turnner@test.com'] });

if (result.rows.length === 0) {
  console.log('USER NOT FOUND');
} else {
  const user = result.rows[0];
  console.log('EMAIL:', user.email);
  console.log('ROLE:', user.role);
  console.log('IS_ACTIVE:', user.is_active);
  console.log('HASH_PREFIX:', user.password_hash.substring(0, 20) + '...');
  
  const match = await bcrypt.compare('Admin@2026!', user.password_hash);
  console.log('PASSWORD_MATCH:', match);
}
process.exit();
