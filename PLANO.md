# 📋 Plano de Melhoria — CASEG

> Roadmap vivo. Marque `[x]` conforme os itens forem concluídos.
> Stack: React 19 + Vite 6 + Tailwind 4 + Fastify 5 + Drizzle/libSQL. Deploy: VM Oracle + Cloudflare Tunnel.

## 🔎 Diagnóstico central

A cadeia de negócio **comprar → liberar acesso → emitir certificado** está **desconectada**:

- Não existe tabela de matrícula/posse. O player (`GET /api/courses/:courseId/player`) só checa login,
  então **qualquer usuário logado acessa o conteúdo de qualquer curso pago, de graça**.
- O webhook do Mercado Pago (`POST /api/payments/webhook`) só loga e retorna 200 — **paga e não libera nada**.
- `pdfPath` do certificado nunca é preenchido; o PDF não é gerado no fluxo do aluno.

Outros achados:
- JWT com fallback de secret hardcoded em `src/server/lib/jwt.ts` (risco se a env faltar em prod).
- `JWT_REFRESH_SECRET` existe no `.env` mas o código ignora (assina refresh com o secret do access).
- `.env` **não** está versionado (ok). MP **não** configurado localmente.
- Sem rate limit no login; usuário desativado continua logando.
- 3 estilos visuais convivendo (brutalista / gradientes / fórum) + conteúdo hardcoded na Home.
- Scripts `tmp-*.mjs`, `fix_homepage.cjs`, `check_users.ts` versionados na raiz.

---

## 🔴 FASE 1 — Acesso, pagamento e segurança

- [x] **1.1 Matrícula e gate de acesso** ✅
  - [x] Tabela `enrollments (user_id, course_id, source, created_at)` + `UNIQUE(user_id, course_id)`
  - [x] Migration idempotente `migrate-commerce.ts` (+ sync de colunas `price`/`is_active` drift)
  - [x] Helper de acesso `src/server/lib/enrollment.ts` (`canAccessCourse`)
  - [x] Gate no player (`courses.ts`) → 403 `not_enrolled` (testado)
  - [x] `POST /api/courses/:id/enroll` (matrícula automática em curso gratuito)
  - [x] Frontend: player redireciona ao detalhe no 403; "Matricular-se" cria matrícula
  - [x] Fix bug: `create-preference` no CourseDetailPage ia sem header `Authorization`
- [x] **1.2 Mercado Pago de ponta a ponta** ✅
  - [x] Tabela `payments` (idempotência via `provider_payment_id` único + auditoria)
  - [x] Webhook real: verificação de assinatura HMAC → consulta API MP → cria `enrollment` quando `approved`
  - [x] URLs configuráveis por env (`PUBLIC_WEB_URL` / `PUBLIC_API_URL`)
- [x] **1.3 Segurança de auth** ✅
  - [x] JWT secret obrigatório (fail-fast, removido fallback) + `JWT_REFRESH_SECRET` em uso (testado)
  - [x] Middleware bloqueia `is_active = false` (testado)
  - [x] Rate limit no `/api/auth/login` (8/15min, testado)
  - [~] `correctAnswer` na atividade: mantido (feedback formativo by-design; prova já não vaza)

> **⚠️ Deploy da Fase 1 na VM:**
> 1. `npm run db:migrate-commerce` (cria enrollments/payments + colunas que faltam)
> 2. Conferir envs: `JWT_SECRET` (obrigatório), `JWT_REFRESH_SECRET`, `MP_ACCESS_TOKEN`,
>    `MP_WEBHOOK_SECRET`, `PUBLIC_WEB_URL`, `PUBLIC_API_URL`
> 3. O gate agora **tranca cursos pagos**: se houver alunos legítimos em cursos pagos,
>    fazer backfill em `enrollments` (ou matricular via admin).

## 🟠 FASE 2 — Completar features ✅
- [x] PDF de certificado: gerador refatorado (núcleo + curso/aula) + `GET /api/certificates/:id/download` + botão funcional (testado: 200, `%PDF-`)
- [x] Botão "Continuar" (Dashboard) → navega pro player
- [x] Currículo real: `GET /api/courses/:id/syllabus` (público) + UI no detalhe do curso
- [x] Replies aninhadas do fórum: **já estavam implementadas** (TopicDetailPage + ThreadReply recursivo) — relatório inicial estava errado
- [~] Form de contato/newsletter da Home sem submit → tratar na Fase 3 (conteúdo honesto)

## 🟡 FASE 3 — Unificação visual & UX ✅
- [x] **Fórum unificado no brutalista** (6 arquivos): ForumDashboard, CourseForum, TopicDetail + ForumCourseCard, TopicListItem, ThreadReply — bordas pretas, sombras duras, verde brand, Space Grotesk uppercase, avatares quadrados (validado por screenshots)
- [x] Depoimentos fake removidos (sem prova social real)
- [x] Notícias da Home agora vêm da API real (`/api/news`); seção some se vazia
- [x] Form de contato ligado via `mailto:` (não era mais botão morto)
- [x] FAQ mantida (conteúdo legítimo); hero mantém overlay de legibilidade (permitido pelo DS)
- [x] Fix infra: proxy do Vite configurável (`VITE_API_PROXY`) — dev local quebrava por Firebird na 3050
- [ ] **PENDENTE (dado de negócio):** stats da Home (`+500 alunos`, `98% aprovação`, `+50 cursos`) são marketing fictício — substituir por números reais ou remover. Telefone/e-mail/endereço de contato também precisam ser reais.

## 🟢 FASE 4 — Qualidade & infra
- [ ] Remover scripts `tmp-*`, `fix_homepage.cjs`, `check_users.ts`
- [ ] Testes dos caminhos críticos (auth, webhook, matrícula, certificado)
- [ ] Sanitização XSS, paginação admin faltante, transações
- [ ] Conferir build de produção + fluxo VM/Cloudflare
