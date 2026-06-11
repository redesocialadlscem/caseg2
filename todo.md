# 🏗️ Reconstrução: Occupational Safety Course Platform (Sem Firebase)

> **Objetivo:** Reconstruir a plataforma do zero, removendo toda dependência do Firebase e migrando para uma stack leve, performática e baseada em **SQLite**.

---

## 🎯 Objetivos da Reconstrução

1.  **Zero Firebase:** Eliminar Auth, Firestore, Functions e Emulators.
2.  **SQLite como Fonte Única:** Banco de dados relacional, arquivo único, portátil e extremamente rápido.
3.  **Performance Extrema:** Backend leve (sem ORM pesado), frontend otimizado (Vite + React 19).
4.  **Tipagem Forte:** TypeScript end-to-end com validação de schema (Zod).
5.  **Autonomia Total:** Controle completo sobre autenticação, regras de negócio e deploy.
6.  **Manter Funcionalidades Essenciais:** Cursos, progresso do aluno, painel admin, certificados e news feed.

---

## 🛠️ Nova Stack Tecnológica

### Frontend
| Tecnologia | Versão | Motivo |
| :--- | :--- | :--- |
| **React** | 19.x | UI moderna, Server Components (opcional), hooks estáveis |
| **TypeScript** | 5.x | Segurança de tipos, melhor DX |
| **Vite** | 7.x | Build ultra-rápido, HMR instantâneo |
| **Tailwind CSS** | 4.x | Estilização utilitária, zero CSS custom desnecessário |
| **Lucide React** | latest | Ícones leves e consistentes |
| **Recharts** | 3.x | Gráficos para dashboard admin/aluno |
| **jsPDF + html2canvas** | latest | Geração de certificados PDF no cliente |
| **clsx + tailwind-merge** | latest | Classes condicionais sem conflitos |

### Backend & Banco de Dados
| Tecnologia | Motivo |
| :--- | :--- |
| **Node.js (ESM)** | Runtime assíncrono, mesmo ecossistema do front |
| **Express / Fastify** | API REST minimalista (Fastify recomendado para perf máxima) |
| **better-sqlite3** | Driver SQLite síncrono/assíncrono, o mais rápido para Node |
| **Drizzle ORM** | ORM leve, type-safe, SQL-first, zero overhead runtime |
| **Zod** | Validação de input/output, integração nativa com Drizzle |
| **JWT (jose)** | Auth stateless, sem dependência de serviço externo |
| **bcryptjs** | Hash de senhas puro JS, sem native bindings problemáticos |

### Ferramentas & DevOps
| Tecnologia | Motivo |
| :--- | :--- |
| **Vitest** | Testes unitários/integração, compatível com Vite |
| **ESLint + Prettier** | Padronização de código |
| **Docker (opcional)** | Ambiente consistente para dev/prod |
| **Render / Railway / Fly.io** | Deploy simples com suporte a SQLite persistente |

---

## 📁 Estrutura de Pastas Sugerida

```
occupational-safety-v2/
├── src/
│   ├── client/          # Frontend React
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── lib/         # utils, zod schemas compartilhados
│   │   └── main.tsx
│   ├── server/          # Backend Node
│   │   ├── db/
│   │   │   ├── schema.ts      # Drizzle schema definitions
│   │   │   ├── migrate.ts     # Scripts de migração
│   │   │   └── seed.ts        # Dados iniciais
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── courses.ts
│   │   │   ├── progress.ts
│   │   │   └── admin.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts        # JWT verification
│   │   │   └── validate.ts    # Zod validation middleware
│   │   ├── lib/
│   │   │   ├── jwt.ts
│   │   │   └── password.ts
│   │   └── index.ts           # Entry point do servidor
│   └── shared/          # Tipos/schemas compartilhados front↔back
│       └── types.ts
├── data/
│   └── app.db           # Arquivo SQLite (gitignored)
├── drizzle/             # Migrações geradas automaticamente
├── package.json
├── tsconfig.json
├── vite.config.ts
└── doc.md               # Este documento
```

---

## 🔑 Decisões Arquiteturais Chave

### 1. Autenticação com JWT Próprio
- **Login:** POST `/api/auth/login` → valida email/senha → retorna access_token (curto) + refresh_token (longo)
- **Refresh:** POST `/api/auth/refresh` → valida refresh_token → novo access_token
- **Proteção:** Middleware verifica JWT em rotas protegidas
- **Admin:** Campo `role` na tabela `users` (enum: 'student' | 'admin')
- **Vantagem:** Zero latência de provedor externo, controle total

### 2. Schema SQLite (Drizzle)
```sql
-- Tabelas principais
users (id, email, name, password_hash, role, created_at)
courses (id, title, description, category, duration_hours, is_active)
modules (id, course_id, title, order_index)
lessons (id, module_id, title, content, video_url, order_index)
progress (id, user_id, lesson_id, completed, completed_at)
certificates (id, user_id, course_id, issued_at, pdf_path)
news (id, title, summary, source_url, published_at)
```

### 3. Performance First
- **SQLite WAL mode:** Habilitar para leituras concorrentes sem bloqueio
- **Índices estratégicos:** `(user_id, lesson_id)` em progress, `(course_id)` em modules
- **Queries otimizadas:** Drizzle gera SQL puro, sem N+1
- **Cache HTTP:** ETags e Cache-Control para dados pouco voláteis (cursos, módulos)
- **Bundle mínimo:** Code splitting por rota, tree-shaking agressivo

### 4. O Que NÃO Trazer da Versão Anterior
- ❌ Firebase SDK (auth, firestore, functions)
- ❌ `firebase-admin`
- ❌ Emulators e scripts relacionados
- ❌ `@firebase/rules-unit-testing`
- ❌ `waitForAuthReady()` e guards de race condition (problema exclusivo do Firebase)
- ❌ `callBackendFunction` / `callPublicBackendFunction` (substituir por fetch/axios direto)

### 5. O Que MANTER / Adaptar
- ✅ Lógica de negócios de cursos e progresso
- ✅ Componentes de UI (adaptar props se necessário)
- ✅ Geração de certificados (jsPDF)
- ✅ News feed (agora via API própria ou scraping no backend)
- ✅ Tailwind + Lucide + Recharts
- ✅ Vitest para testes

---

## 🚀 Passos Iniciais Recomendados

1.  **Scaffold:** Criar projeto Vite + React + TS + Express/Fastify monorepo
2.  **DB Setup:** Configurar Drizzle + better-sqlite3 + primeira migração (users)
3.  **Auth:** Implementar login/register/JWT no backend + hook `useAuth` no front
4.  **Cursos CRUD:** Rotas + páginas de listagem/detalhe
5.  **Progresso:** Marcar aulas como concluídas + dashboard
6.  **Admin:** Painel com gestão de cursos/usuários
7.  **Certificados:** Gerar PDF ao concluir curso
8.  **Testes:** Cobrir rotas críticas + componentes chave
9.  **Deploy:** Configurar ambiente prod com volume persistente para SQLite

---

## ⚡ Dicas de Otimização SQLite

- Use **prepared statements** (Drizzle faz isso automaticamente)
- Ative **WAL mode**: `PRAGMA journal_mode=WAL;`
- Defina **cache_size**: `PRAGMA cache_size=-64000;` (64MB)
- Use **transactions** para escritas em lote
- Evite ORMs pesados (Prisma, TypeORM) — Drizzle é suficiente
- Faça backup periódico do arquivo `.db` (é só copiar o arquivo!)

---

*Documento gerado para guiar a reconstrução da plataforma. Atualize conforme novas decisões forem tomadas.*
