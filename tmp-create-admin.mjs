import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const c = createClient({ url: 'file:/home/ubuntu/caseg2/caseg2/data/app.db' });
const hash = await bcrypt.hash('Admin@2026!', 10);

// Check if user exists first
const existing = await c.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: ['turnner@test.com'] });

if (existing.rows.length > 0) {
  await c.execute({ sql: 'UPDATE users SET password_hash = ?, role = ?, is_active = 1 WHERE email = ?', args: [hash, 'admin', 'turnner@test.com'] });
  console.log('USER UPDATED');
} else {
  await c.execute({ sql: 'INSERT INTO users (email, name, password_hash, role, is_active, created_at) VALUES (?, ?, ?, ?, 1, unixepoch())', args: ['turnner@test.com', 'Turnner', hash, 'admin'] });
  console.log('USER CREATED');
}

// Verify
const check = await c.execute({ sql: 'SELECT id, email, name, role, is_active FROM users WHERE email = ?', args: ['turnner@test.com'] });
console.log('RESULT:', JSON.stringify(check.rows));
process.exit();
