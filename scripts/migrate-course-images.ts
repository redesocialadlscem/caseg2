/**
 * Backfill das imagens dos cursos.
 *
 * Este script nao depende de banco fonte. Ele usa a lista abaixo, garante a
 * coluna courses.image_url e preenche somente cursos que ainda estao sem imagem.
 *
 * Uso: npm run db:migrate-images
 */
import { createClient } from '@libsql/client';
import { resolve } from 'node:path';

const databaseUrl = process.env.DATABASE_URL?.trim() || `file:${resolve(process.cwd(), 'data/app.db')}`;

const COURSE_IMAGES = [
  {
    id: 1,
    title: 'NR-10 Seguranca em Instalacoes Eletricas',
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=400&fit=crop&q=80',
  },
  {
    id: 2,
    title: 'NR-35 Trabalho em Altura',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop&q=80',
  },
  {
    id: 3,
    title: 'NR-5 CIPA Comissao Interna de Prevencao',
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=400&fit=crop&q=80',
  },
  {
    id: 4,
    title: 'NR-6 Equipamentos de Protecao Individual',
    url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&h=400&fit=crop&q=80',
  },
  {
    id: 5,
    title: 'PGR Programa de Gerenciamento de Riscos',
    url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop&q=80',
  },
  {
    id: 6,
    title: 'NR-33 Espacos Confinados',
    url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=400&fit=crop&q=80',
  },
  {
    id: 7,
    title: 'Brigada de Incendio e Emergencias',
    url: 'https://images.unsplash.com/photo-1563214814-c10427b3b31e?w=600&h=400&fit=crop&q=80',
  },
  {
    id: 8,
    title: 'Primeiros Socorros para TST',
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop&q=80',
  },
];

function normalizeTitle(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

const imageByTitle = new Map(COURSE_IMAGES.map((course) => [normalizeTitle(course.title), course.url]));
const imageById = new Map(COURSE_IMAGES.map((course) => [course.id, course.url]));

async function main() {
  const db = createClient({ url: databaseUrl });

  const columns = await db.execute('PRAGMA table_info(courses)');
  const hasImageUrl = columns.rows.some((row) => row.name === 'image_url');

  if (!hasImageUrl) {
    await db.execute("ALTER TABLE courses ADD COLUMN image_url TEXT NOT NULL DEFAULT ''");
    console.log('Coluna courses.image_url criada.');
  }

  console.log('Atualizando imagens dos cursos...');

  const courses = await db.execute('SELECT id, title, image_url FROM courses ORDER BY id');
  let updated = 0;
  let alreadyFilled = 0;
  let withoutMatch = 0;

  for (const course of courses.rows) {
    const currentImage = String(course.image_url ?? '').trim();
    if (currentImage) {
      alreadyFilled++;
      continue;
    }

    const url = imageByTitle.get(normalizeTitle(course.title)) || imageById.get(Number(course.id));
    if (!url) {
      withoutMatch++;
      console.log(`Sem imagem mapeada: [${course.id}] ${course.title}`);
      continue;
    }

    const result = await db.execute({
      sql: 'UPDATE courses SET image_url = ? WHERE id = ? AND (image_url IS NULL OR image_url = ?)',
      args: [url, course.id, ''],
    });

    if (result.rowsAffected > 0) {
      updated += result.rowsAffected;
      console.log(`Atualizado: [${course.id}] ${course.title}`);
    }
  }

  console.log(`Concluido: ${updated} atualizado(s), ${alreadyFilled} ja tinham imagem, ${withoutMatch} sem mapa.`);
  db.close();
}

main().catch((err) => {
  console.error('Erro:', err?.message || err);
  process.exit(1);
});
