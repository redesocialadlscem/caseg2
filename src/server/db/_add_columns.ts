import { createClient } from '@libsql/client';
import path from 'node:path';

const DB_PATH = path.resolve(process.cwd(), 'data', 'app.db');
const client = createClient({ url: `file:${DB_PATH}` });

try {
  await client.execute(`ALTER TABLE courses ADD COLUMN image_url TEXT DEFAULT ''`);
  console.log('✅ Added image_url column');
} catch (e: any) {
  if (e.message?.includes('duplicate column')) {
    console.log('⏭️  image_url already exists');
  } else {
    throw e;
  }
}

try {
  await client.execute(`ALTER TABLE courses ADD COLUMN is_featured INTEGER DEFAULT 0`);
  console.log('✅ Added is_featured column');
} catch (e: any) {
  if (e.message?.includes('duplicate column')) {
    console.log('⏭️  is_featured already exists');
  } else {
    throw e;
  }
}

console.log('🎉 Done');
client.close();
