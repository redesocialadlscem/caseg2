import { createClient } from '@libsql/client';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = path.resolve(process.cwd(), 'data', 'app.db');

if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// Conexão única e direta — sem Drizzle, sem cache de schema
const client = createClient({ url: `file:${DB_PATH}` });

const CREATE_TABLES_SQL = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'student' NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '' NOT NULL,
    category TEXT DEFAULT '' NOT NULL,
    duration_hours REAL DEFAULT 0 NOT NULL,
    image_url TEXT DEFAULT '' NOT NULL,
    is_featured INTEGER DEFAULT 0 NOT NULL,
    is_active INTEGER DEFAULT 1 NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER DEFAULT 0 NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT DEFAULT '' NOT NULL,
    video_url TEXT DEFAULT '' NOT NULL,
    order_index INTEGER DEFAULT 0 NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed INTEGER DEFAULT 0 NOT NULL,
    completed_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    issued_at INTEGER DEFAULT (unixepoch()) NOT NULL,
    pdf_path TEXT DEFAULT '' NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT DEFAULT '' NOT NULL,
    source_url TEXT DEFAULT '' NOT NULL,
    published_at INTEGER DEFAULT (unixepoch()) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT DEFAULT '' NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS live_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    title TEXT NOT NULL,
    course_name TEXT DEFAULT '' NOT NULL,
    company_code TEXT NOT NULL,
    scheduled_at INTEGER NOT NULL,
    duration_minutes INTEGER DEFAULT 60 NOT NULL,
    status TEXT DEFAULT 'scheduled' NOT NULL,
    jitsi_room TEXT DEFAULT '' NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS live_session_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    session_id INTEGER NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    company_code TEXT NOT NULL,
    joined_at INTEGER DEFAULT (unixepoch()) NOT NULL,
    completed_at INTEGER,
    certificate_issued INTEGER DEFAULT 0 NOT NULL
  )`,
];

interface SeedLesson { title: string; content: string }
interface SeedModule { title: string; lessons: SeedLesson[] }
interface SeedCourse {
  title: string;
  description: string;
  category: string;
  durationHours: number;
  imageUrl: string;
  modules: SeedModule[];
}

const SEED_DATA: SeedCourse[] = [
  {
    title: 'NR-10 Segurança em Instalações Elétricas',
    description: 'Capacitação obrigatória para profissionais que atuam com eletricidade. Aborda riscos elétricos, medidas de controle, EPIs específicos e procedimentos de emergência conforme a norma regulamentadora.',
    category: 'Normas Regulamentadoras',
    durationHours: 40,
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=400&fit=crop&q=80',
    modules: [
      { title: 'Introdução à NR-10 e Riscos Elétricos', lessons: [
        { title: 'Objetivo e campo de aplicação da NR-10', content: 'A NR-10 estabelece requisitos mínimos para garantir a segurança dos trabalhadores envolvidos com instalações elétricas.' },
        { title: 'Tipos de riscos elétricos', content: 'Choque elétrico, arco voltaico, campos eletromagnéticos e incêndios de origem elétrica.' },
      ]},
      { title: 'Medidas de Controle e Proteção', lessons: [
        { title: 'Desenergização e bloqueio/tagout', content: 'Procedimentos obrigatórios para desenergizar circuitos antes de intervenções.' },
        { title: 'EPIs e EPCs para eletricidade', content: 'Luvas isolantes, óculos, capacete classe B, tapetes isolantes e varas de manobra.' },
      ]},
    ],
  },
  {
    title: 'NR-35 Trabalho em Altura',
    description: 'Treinamento para atividades realizadas acima de 2 metros do nível inferior. Cobre análise de risco, sistemas de proteção contra quedas, resgate e responsabilidades legais.',
    category: 'Normas Regulamentadoras',
    durationHours: 8,
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop&q=80',
    modules: [
      { title: 'Fundamentos do Trabalho em Altura', lessons: [
        { title: 'Definições e responsabilidades', content: 'Empregador deve garantir planejamento, organização e execução segura das atividades em altura.' },
        { title: 'Análise de Risco (AR) e PT', content: 'Toda atividade não rotineira exige Análise de Risco e Permissão de Trabalho documentada.' },
      ]},
      { title: 'Sistemas de Proteção Contra Quedas', lessons: [
        { title: 'SPIQ e tipos de ancoragem', content: 'Sistema de Proteção Individual contra Quedas: cinturão tipo paraquedista, talabarte, corda e ponto de ancoragem.' },
        { title: 'Fator de queda e zona livre', content: 'Cálculo da zona livre de queda e seleção correta do equipamento para cada cenário.' },
      ]},
    ],
  },
  {
    title: 'NR-5 CIPA - Comissão Interna de Prevenção',
    description: 'Formação completa para membros da CIPA. Aborda atribuições, reuniões, mapa de riscos, SIPAT e investigação de acidentes conforme NR-5 atualizada.',
    category: 'Gestão de Segurança',
    durationHours: 20,
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=400&fit=crop&q=80',
    modules: [
      { title: 'Organização e Atribuições da CIPA', lessons: [
        { title: 'Composição e dimensionamento', content: 'A CIPA é composta por representantes do empregador e dos empregados, dimensionada pelo Quadro I da NR-5.' },
        { title: 'Reuniões ordinárias e extraordinárias', content: 'Reuniões mensais obrigatórias com ata registrada. Reuniões extras em caso de acidente grave ou denúncia.' },
      ]},
      { title: 'Mapa de Riscos e SIPAT', lessons: [
        { title: 'Elaboração do Mapa de Riscos', content: 'Representação gráfica dos riscos ambientais por cores e círculos de tamanhos proporcionais à gravidade.' },
        { title: 'Planejamento da SIPAT', content: 'Semana Interna de Prevenção de Acidentes do Trabalho: evento anual obrigatório com palestras e atividades educativas.' },
      ]},
    ],
  },
  {
    title: 'NR-6 Equipamentos de Proteção Individual',
    description: 'Curso sobre seleção, uso, manutenção e fiscalização de EPIs. Inclui CA (Certificado de Aprovação), responsabilidades do empregador e do trabalhador.',
    category: 'Normas Regulamentadoras',
    durationHours: 8,
    imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&h=400&fit=crop&q=80',
    modules: [
      { title: 'Legislação e Responsabilidades', lessons: [
        { title: 'Obrigações do empregador e empregado', content: 'Empregador fornece EPI gratuito com CA válido. Empregado usa, guarda e conserva o equipamento.' },
        { title: 'Certificado de Aprovação (CA)', content: 'Todo EPI comercializado no Brasil deve possuir CA emitido pelo MTE, com validade vigente.' },
      ]},
      { title: 'Tipos de EPI por Risco', lessons: [
        { title: 'Proteção da cabeça, olhos e face', content: 'Capacetes, óculos de segurança, protetores faciais e máscaras de solda.' },
        { title: 'Proteção respiratória e auditiva', content: 'Respiradores PFF1/PFF2, máscaras semifaciais, protetores auriculares tipo plug e concha.' },
      ]},
    ],
  },
  {
    title: 'PGR - Programa de Gerenciamento de Riscos',
    description: 'Elaboração prática do PGR conforme NR-9 e NR-1. Substituiu o PPRA e integra o GRO (Gerenciamento de Riscos Ocupacionais) exigido pelo eSocial.',
    category: 'Gestão de Segurança',
    durationHours: 16,
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop&q=80',
    modules: [
      { title: 'GRO e Estrutura do PGR', lessons: [
        { title: 'Diferença entre PPRA e PGR', content: 'O PGR é mais abrangente: cobre todos os riscos (físicos, químicos, biológicos, ergonômicos e de acidentes), não apenas ambientais.' },
        { title: 'Inventário de Riscos e Plano de Ação', content: 'Dois documentos-base do PGR: inventário identifica e avalia riscos; plano de ação define cronograma de medidas preventivas.' },
      ]},
      { title: 'Integração com eSocial', lessons: [
        { title: 'Eventos S-2240 e S-2220', content: 'Envio de dados de exposição a agentes nocivos e monitoramento da saúde do trabalhador via eSocial.' },
        { title: 'Atualização contínua do PGR', content: 'PGR deve ser revisado sempre que houver mudanças no ambiente de trabalho, processos ou legislação.' },
      ]},
    ],
  },
  {
    title: 'NR-33 Espaços Confinados',
    description: 'Capacitação para entrada, supervisão e resgate em espaços confinados. Aborda atmosfera perigosa, ventilação, medição de gases e plano de emergência.',
    category: 'Normas Regulamentadoras',
    durationHours: 16,
    imageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=400&fit=crop&q=80',
    modules: [
      { title: 'Reconhecimento e Avaliação', lessons: [
        { title: 'Definição e exemplos de espaços confinados', content: 'Tanques, silos, poços, tubulações, caldeiras e qualquer área com aberturas limitadas e ventilação insuficiente.' },
        { title: 'Atmosfera perigosa e medição de gases', content: 'Teste atmosférico obrigatório antes da entrada: O2, LEL, CO, H2S. Equipamentos calibrados e intrinsecamente seguros.' },
      ]},
      { title: 'Procedimentos de Entrada e Resgate', lessons: [
        { title: 'PET - Permissão de Entrada e Trabalho', content: 'Documento escrito contendo todas as medidas de controle, equipe autorizada e vigência da entrada.' },
        { title: 'Plano de Emergência e Resgate', content: 'Equipe de resgate treinada, equipamentos de comunicação e extração disponíveis antes de qualquer entrada.' },
      ]},
    ],
  },
  {
    title: 'Brigada de Incêndio e Emergências',
    description: 'Formação de brigadistas conforme NBR 14276 e IT do Corpo de Bombeiros. Teoria do fogo, classes de incêndio, uso de extintores e hidrantes, abandono de área.',
    category: 'Emergências',
    durationHours: 12,
    imageUrl: 'https://images.unsplash.com/photo-1563214814-c10427b3b31e?w=600&h=400&fit=crop&q=80',
    modules: [
      { title: 'Teoria do Fogo e Classes de Incêndio', lessons: [
        { title: 'Tetraedro do fogo e métodos de extinção', content: 'Combustível, comburente, calor e reação em cadeia. Métodos: resfriamento, abafamento, isolamento e interrupção química.' },
        { title: 'Classes A, B, C, D e K', content: 'Identificação de cada classe de incêndio e agente extintor adequado para cada uma.' },
      ]},
      { title: 'Prática de Combate e Abandono', lessons: [
        { title: 'Uso correto de extintores portáteis', content: 'Técnica PASS: puxar, apontar, apertar, espalhar. Distância segura e direção do vento.' },
        { title: 'Plano de Abandono de Área', content: 'Rotas de fuga, sinalização, pontos de encontro e procedimentos para evacuação ordenada.' },
      ]},
    ],
  },
  {
    title: 'Primeiros Socorros para TST',
    description: 'Atendimento básico de emergências médicas no ambiente de trabalho. Suporte básico de vida, hemorragias, fraturas, queimaduras e protocolo de acionamento.',
    category: 'Emergências',
    durationHours: 8,
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop&q=80',
    modules: [
      { title: 'Suporte Básico de Vida', lessons: [
        { title: 'Avaliação primária (ABCDE)', content: 'Via aérea, respiração, circulação, déficit neurológico e exposição. Sequência lógica de atendimento.' },
        { title: 'RCP e uso do DEA', content: 'Compressões torácicas de alta qualidade (100-120/min) e desfibrilação precoce aumentam sobrevivência.' },
      ]},
      { title: 'Traumas e Emergências Clínicas', lessons: [
        { title: 'Controle de hemorragias e curativos', content: 'Pressão direta, elevação, torniquete em último recurso. Curativo compressivo e imobilização.' },
        { title: 'Queimaduras e intoxicações', content: 'Classificação por grau, resfriamento imediato, não romper bolhas. Intoxicação: identificar agente e acionar SAMU.' },
      ]},
    ],
  },
];

async function seed() {
  // 1. Criar tabelas via SQL direto
  console.log('🔧 Creating tables via SQL...');
  for (const stmt of CREATE_TABLES_SQL) {
    await client.execute(stmt);
  }
  console.log('✅ Tables ready');

  // 2. Inserir cursos via SQL direto (idempotente)
  console.log('🌱 Starting seed...');

  for (const course of SEED_DATA) {
    const existing = await client.execute({
      sql: 'SELECT id FROM courses WHERE title = ?',
      args: [course.title],
    });

    if (existing.rows.length > 0) {
      console.log(`⏭️  Skipping "${course.title}" (already exists)`);
      continue;
    }

    const result = await client.execute({
      sql: 'INSERT INTO courses (title, description, category, duration_hours, image_url, is_featured, is_active) VALUES (?, ?, ?, ?, ?, 0, 1)',
      args: [course.title, course.description, course.category, course.durationHours, course.imageUrl],
    });
    const courseId = Number(result.lastInsertRowid);
    console.log(`✅ Created course: ${course.title} (id=${courseId})`);

    for (let mIdx = 0; mIdx < course.modules.length; mIdx++) {
      const mod = course.modules[mIdx];
      const modResult = await client.execute({
        sql: 'INSERT INTO modules (course_id, title, order_index) VALUES (?, ?, ?)',
        args: [courseId, mod.title, mIdx],
      });
      const moduleId = Number(modResult.lastInsertRowid);

      for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
        const lesson = mod.lessons[lIdx];
        await client.execute({
          sql: 'INSERT INTO lessons (module_id, title, content, video_url, order_index) VALUES (?, ?, ?, \'\', ?)',
          args: [moduleId, lesson.title, lesson.content, lIdx],
        });
      }
    }
  }

  console.log('🎉 Seed completed successfully!');
}

try {
  await seed();
} catch (error) {
  console.error('❌ Seed failed:', error);
  process.exit(1);
} finally {
  client.close();
}
