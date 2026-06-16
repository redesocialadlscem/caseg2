/**
 * Migração de imagens dos cursos
 * Lê image_url do banco local (caseg2 original) e atualiza o banco do projeto atual (Z:\)
 *
 * Uso: npx tsx scripts/migrate-course-images.ts
 */
import { createClient } from '@libsql/client';
import { resolve } from 'path';

const SOURCE_DB = 'C:/Users/lucas/Desktop/Projetos Sites/caseg2/data/app.db';
const TARGET_DB = resolve(process.cwd(), 'data/app.db');

async function main() {
  console.log('📦 Lendo imagens do banco fonte...');
  const sourceDb = createClient({ url: `file:${SOURCE_DB}` });
  const sourceRows = await sourceDb.execute('SELECT id, title, image_url FROM courses WHERE image_url != ""');
  console.log(`   Encontrados ${sourceRows.rows.length} cursos com imagem.`);

  console.log('🎯 Atualizando banco alvo...');
  const targetDb = createClient({ url: `file:${TARGET_DB}` });

  let updated = 0;
  let skipped = 0;

  for (const row of sourceRows.rows) {
    const result = await targetDb.execute({
      sql: 'UPDATE courses SET image_url = ? WHERE id = ?',
      args: [row.image_url as string, row.id as number],
    });

    if (result.rowsAffected > 0) {
      updated++;
      console.log(`   ✅ [${row.id}] ${(row.title as string).substring(0, 40)} → ${(row.image_url as string).substring(0, 60)}...`);
    } else {
      skipped++;
      console.log(`   ⏭️  [${row.id}] Curso não encontrado no banco alvo`);
    }
  }

  console.log(`\n🏁 Concluído! ${updated} atualizados, ${skipped} ignorados.`);

  sourceDb.close();
  targetDb.close();
}

main().catch((err) => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
