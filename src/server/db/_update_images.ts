import { createClient } from '@libsql/client';
import path from 'node:path';

const DB_PATH = path.resolve(process.cwd(), 'data', 'app.db');
const client = createClient({ url: `file:${DB_PATH}` });

const IMAGES: Record<string, string> = {
  'NR-10 Segurança em Instalações Elétricas': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=400&fit=crop&q=80',
  'NR-35 Trabalho em Altura': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop&q=80',
  'NR-5 CIPA - Comissão Interna de Prevenção': 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=400&fit=crop&q=80',
  'NR-6 Equipamentos de Proteção Individual': 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&h=400&fit=crop&q=80',
  'PGR - Programa de Gerenciamento de Riscos': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop&q=80',
  'NR-33 Espaços Confinados': 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=400&fit=crop&q=80',
  'Brigada de Incêndio e Emergências': 'https://images.unsplash.com/photo-1563214814-c10427b3b31e?w=600&h=400&fit=crop&q=80',
  'Primeiros Socorros para TST': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop&q=80',
};

let updated = 0;
for (const [title, imageUrl] of Object.entries(IMAGES)) {
  const result = await client.execute({
    sql: 'UPDATE courses SET image_url = ? WHERE title = ?',
    args: [imageUrl, title],
  });
  if (result.rowsAffected && result.rowsAffected > 0) {
    console.log(`✅ ${title}`);
    updated++;
  } else {
    console.log(`⏭️  Not found: ${title}`);
  }
}

console.log(`\n🎉 Updated ${updated} courses with images`);
client.close();
