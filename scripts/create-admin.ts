import 'dotenv/config';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import path from 'node:path';

/**
 * Cria (ou promove) uma conta admin.
 *
 * Por variáveis de ambiente (recomendado — não vaza a senha no histórico):
 *   ADMIN_EMAIL=voce@dominio.com ADMIN_PASSWORD='SenhaForte123' ADMIN_NAME='Seu Nome' \
 *     node --import tsx scripts/create-admin.ts
 *
 * Ou por argumentos:
 *   node --import tsx scripts/create-admin.ts voce@dominio.com 'SenhaForte123' 'Seu Nome'
 */
async function main() {
  const email = (process.env.ADMIN_EMAIL || process.argv[2] || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || process.argv[3] || '';
  const name = (process.env.ADMIN_NAME || process.argv[4] || 'Administrador').trim();

  if (!email || !password) {
    console.error('❌ Uso: ADMIN_EMAIL=.. ADMIN_PASSWORD=.. ADMIN_NAME=.. node --import tsx scripts/create-admin.ts');
    console.error('   (ou) node --import tsx scripts/create-admin.ts <email> <senha> "<nome>"');
    process.exit(1);
  }
  if (!email.includes('@')) {
    console.error('❌ E-mail inválido:', email);
    process.exit(1);
  }
  if (password.length < 6) {
    console.error('❌ A senha precisa ter ao menos 6 caracteres.');
    process.exit(1);
  }

  const DB_PATH = path.resolve(process.cwd(), 'data', 'app.db');
  const db = createClient({ url: `file:${DB_PATH}` });
  const hash = await bcrypt.hash(password, 10);

  await db.execute({
    sql: `INSERT INTO users (email, password_hash, name, role, is_active)
          VALUES (?, ?, ?, 'admin', 1)
          ON CONFLICT(email) DO UPDATE SET
            password_hash = excluded.password_hash,
            name = excluded.name,
            role = 'admin',
            is_active = 1`,
    args: [email, hash, name],
  });

  console.log('✅ Conta admin criada/atualizada com sucesso!');
  console.log('   Email:', email);
  console.log('   Nome :', name);
  db.close();
}

main().catch((err) => {
  console.error('❌ Erro ao criar admin:', err);
  process.exit(1);
});
