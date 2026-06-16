/**
 * Backfill das imagens dos cursos.
 *
 * Preenche `courses.image_url` (por TÍTULO) para cursos que estão sem imagem.
 * Self-contained: não depende de nenhum banco externo — usa o mapa abaixo,
 * que reflete as imagens curadas do seed. Só atualiza onde image_url está vazio,
 * então NÃO sobrescreve imagens que você já tenha configurado no admin.
 *
 * Uso: npm run db:migrate-images   (ou: node --import tsx scripts/migrate-course-images.ts)
 */
import { createClient } from '@libsql/client';
import { resolve } from 'node:path';

const DB_PATH = resolve(process.cwd(), 'data/app.db');

// título do curso → URL da imagem
const IMAGE_BY_TITLE: Record<string, string> = {
  'NR-10 Segurança em Instalações Elétricas': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=400&fit=crop&q=80',
  'NR-35 Trabalho em Altura': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop&q=80',
  'NR-5 CIPA - Comissão Interna de Prevenção': 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=400&fit=crop&q=80',
  'NR-6 Equipamentos de Proteção Individual': 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&h=400&fit=crop&q=80',
  'PGR - Programa de Gerenciamento de Riscos': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop&q=80',
  'NR-33 Espaços Confinados': 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=400&fit=crop&q=80',
  'Brigada de Incêndio e Emergências': 'https://images.unsplash.com/photo-1563214814-c10427b3b31e?w=600&h=400&fit=crop&q=80',
  'Primeiros Socorros para TST': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop&q=80',
};

async function main() {
  const db = createClient({ url: `file:${DB_PATH}` });

  // Garante a coluna (caso a base seja legada e ainda não tenha image_url)
  try {
    await db.execute("ALTER TABLE courses ADD COLUMN image_url TEXT NOT NULL DEFAULT ''");
  } catch (e: any) {
    if (!String(e?.message).includes('duplicate column')) throw e;
  }

  console.log('🎯 Atualizando imagens dos cursos (apenas os sem imagem)...');
  let updated = 0;
  let skipped = 0;

  for (const [title, url] of Object.entries(IMAGE_BY_TITLE)) {
    // Só preenche se estiver vazio/nulo — não sobrescreve imagens já definidas
    const result = await db.execute({
      sql: "UPDATE courses SET image_url = ? WHERE title = ? AND (image_url IS NULL OR image_url = '')",
      args: [url, title],
    });
    if (result.rowsAffected > 0) {
      updated += result.rowsAffected;
      console.log(`   ✅ ${title}`);
    } else {
      skipped++;
    }
  }

  // Relatório dos que ainda estão sem imagem (título fora do mapa)
  const semImagem = await db.execute("SELECT id, title FROM courses WHERE image_url IS NULL OR image_url = ''");
  console.log(`\n🏁 ${updated} curso(s) atualizado(s), ${skipped} já estavam ok ou sem correspondência.`);
  if (semImagem.rows.length > 0) {
    console.log(`⚠️  ${semImagem.rows.length} curso(s) ainda SEM imagem (título não está no mapa — defina pelo admin):`);
    for (const r of semImagem.rows) console.log(`   • [${r.id}] ${r.title}`);
  }

  db.close();
}

main().catch((err) => {
  console.error('❌ Erro:', err?.message || err);
  process.exit(1);
});
