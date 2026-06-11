import { migrate } from 'drizzle-orm/libsql/migrator';
import { db, client } from './index.js';

console.log('🚀 Running migrations...');

try {
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('✅ Migrations completed successfully');
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  client.close();
}
