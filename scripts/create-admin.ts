import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

async function main() {
  const db = createClient({ url: 'file:data/app.db' });
  const hash = await bcrypt.hash('Admin@2026!', 10);
  
  await db.execute({
    sql: `INSERT INTO users (email, password_hash, name, role, is_active) 
          VALUES ('turnner@test.com', ?, 'Turnner Admin', 'admin', 1) 
          ON CONFLICT(email) DO UPDATE SET 
            password_hash=excluded.password_hash, 
            role='admin', 
            is_active=1, 
            name='Turnner Admin'`,
    args: [hash]
  });
  
  console.log('✅ Credencial admin criada/atualizada!');
  console.log('   Email: turnner@test.com');
  console.log('   Senha: Admin@2026!');
  db.close();
}

main().catch(console.error);
