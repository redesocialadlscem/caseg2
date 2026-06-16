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
- [x] Remover scripts `tmp-*`, `fix_homepage.cjs`, `check_users.ts`
- [ ] Testes dos caminhos críticos (auth, webhook, matrícula, certificado)
- [ ] Sanitização XSS, paginação admin faltante, transações
- [ ] Conferir build de produção + fluxo VM/Cloudflare

## 🔵 FASE 5 — Aula Interativa ("Centro de Operações")
> Camada de interação em tempo real sobre o Jitsi. Tudo **configurável pelo professor**
> (não dependemos de dados de curso pré-existentes). Spec detalhada no fim deste arquivo.

- [ ] **5.0 MVP / vertical slice (o loop central)**
  - [ ] Modelo de dados: `interactions` (banco reutilizável), `session_interactions` (ativações na aula), `interaction_responses`
  - [ ] Tempo real via WebSocket (`@fastify/websocket`), sala por sessão
  - [ ] Admin → **Banco de Interações**: CRUD (começar com Quiz, V/F, Enquete)
  - [ ] Aula ao vivo: **painel do professor** (liberar + stats ao vivo) e **painel do aluno** (responder com timer) ao lado do Jitsi
  - [ ] Loop completo: liberar → responder → estatística ao vivo
- [ ] **5.1 Demais tipos**: Complete a frase, Palavra-chave, Presença relâmpago, Ordene os passos, Ligue as colunas, Imagem interativa (clique), Simulação de ocorrência
- [ ] **5.2 Pontuação + Score de Atenção** (regras de pontos, cálculo, ranking ao vivo)
- [ ] **5.3 Agendamento** (disparo manual + automático após X min / horário)
- [ ] **5.4 Analytics** (relatório da turma + individual pós-aula)
- [ ] **5.5 Certificação configurável** (presença/score/interações mínimas liberam ou bloqueiam o certificado)
- [ ] **5.6 Banco reutilizável** (duplicar, compartilhar entre cursos, categorias, import/export)
- [ ] **5.7 Antifraude básico + escala + polimento visual "SOC"** (alertas, ocorrências, decisões rápidas)

---

## 📎 Spec original (referência da Fase 5)

Integração com Jitsi
Layout recomendado

Dividir a tela em:

┌───────────────────────────────┬──────────────┐
│                               │              │
│           JITSI               │ Interações   │
│                               │              │
│                               │              │
└───────────────────────────────┴──────────────┘

Alternativamente, permitir modo popup/modal para atividades obrigatórias.

Módulo de Criação de Interações

O professor deve possuir uma área chamada:

Banco de Interações

Onde pode criar, editar, duplicar, organizar e reutilizar atividades.

Categorias:

Quiz
Múltipla escolha
Verdadeiro ou Falso
Complete a frase
Digitação rápida
Palavra-chave
Imagem interativa
Clique na área correta
Ligue as colunas
Ordenação de passos
Simulação de ocorrência
Enquete
Presença relâmpago
Tipo 1 - Quiz

Campos:

Pergunta

Alternativa A
Alternativa B
Alternativa C
Alternativa D

Resposta Correta

Tempo Limite

Exibir:

Qual o primeiro procedimento ao identificar um princípio de incêndio?

○ Acionar alarme
○ Ignorar ocorrência
○ Registrar em sistema
○ Chamar visitante

Tempo: 20 segundos
Tipo 2 - Verdadeiro ou Falso

Exemplo:

O vigilante pode abandonar o posto sem autorização.

○ Verdadeiro
○ Falso
Tipo 3 - Complete a Frase

Exemplo:

O equipamento utilizado para combate inicial a incêndio é o ________.

Correção automática por palavras-chave.

Tipo 4 - Palavra-Chave

Objetivo:

Validar atenção.

Professor informa verbalmente uma palavra durante a aula.

Depois dispara:

Digite a palavra informada pelo instrutor.

Tempo:

10 a 30 segundos.

Tipo 5 - Presença Relâmpago

Objetivo:

Confirmar que o aluno está acompanhando.

Exemplo:

Clique no botão abaixo em até 10 segundos.

[CONFIRMAR PRESENÇA]

Registrar:

Quem respondeu.
Tempo de resposta.
Tipo 6 - Imagem Interativa

Professor envia uma imagem.

Pergunta:

Clique onde existe um risco de segurança.

O sistema registra coordenadas clicadas.

Comparar com áreas corretas configuradas pelo professor.

Exemplos:

Extintor bloqueado.
Saída de emergência obstruída.
Falta de EPI.
Pessoa em área restrita.
Tipo 7 - Ligue as Colunas

Exemplo:

Extintor → Combate a incêndio

Rádio → Comunicação

CFTV → Monitoramento

Interface drag-and-drop.

Tipo 8 - Ordene os Passos

Exemplo:

Organize corretamente o procedimento:

- Acionar alarme
- Identificar risco
- Evacuar local
- Informar responsáveis

Aluno reorganiza a sequência.

Tipo 9 - Simulação de Ocorrência

Principal funcionalidade da plataforma.

Exemplo:

🚨 OCORRÊNCIA

Visitante sem identificação tenta acessar área restrita.

O que fazer?

Opções:

Liberar acesso
Solicitar identificação
Ignorar
Acionar apoio

Após votação:

Exibir estatísticas.

Professor comenta a resposta correta.

Tipo 10 - Enquete

Sem resposta certa.

Exemplo:

Você já trabalhou em portaria?

○ Sim
○ Não

Mostrar resultados em tempo real.

Agendamento de Interações

Cada interação pode ser configurada como:

Manual

Professor escolhe quando disparar.

Automática

Disparar após:

5 minutos
15 minutos
30 minutos
45 minutos

Ou em horários específicos.

Painel do Professor

Durante a aula:

Interações da Aula

[LIBERAR]

Quiz #1
Quiz #2
Imagem #1
Simulação #1

Ao abrir:

Participantes:
95/110

Respondidas:
87

Pendentes:
8

Tempo médio:
5 segundos

Taxa de acerto:
78%

Atualização em tempo real via WebSocket.

Ranking de Participação

Criar sistema de pontuação.

Pontuação

Entrou na aula:

+10

Respondeu interação:

+5

Resposta correta:

+5

Resposta em menos de 5 segundos:

+3

Ignorou interação:

-10

Saiu da sala:

-5

Score de Atenção

Calcular automaticamente.

Exemplo:

Aluno: João Silva

Tempo conectado:
100%

Interações respondidas:
95%

Acertos:
88%

Tempo médio:
6 segundos

Score de Atenção:
91%
Dashboard Analítico

Após a aula gerar relatório.

Relatório da Turma
Participantes:
120

Interações aplicadas:
15

Taxa média de resposta:
93%

Taxa média de acerto:
84%

Tempo médio de resposta:
7 segundos
Relatório Individual
Aluno:
Carlos

Tempo conectado:
98%

Interações recebidas:
15

Respondidas:
14

Acertos:
12

Erros:
2

Score de atenção:
89%
Certificação

Permitir regras configuráveis.

Exemplo:

Presença mínima:
75%

Score de atenção mínimo:
70%

Interações respondidas:
80%

Caso não cumpra:

Certificado bloqueado.
Banco Reutilizável de Conteúdo

Permitir:

Duplicar interação.
Compartilhar entre cursos.
Organizar por categoria.
Organizar por disciplina.
Importar/exportar.

Exemplo:

Curso Vigilante

250 Quizzes
80 Simulações
120 Imagens
50 Ordenações
Requisitos Técnicos
Frontend: React/Next.js.
Atualização em tempo real via WebSocket.
Compatível com desktop e mobile.
Integração transparente com Jitsi.
Persistência de respostas.
Histórico completo.
Escalável para milhares de alunos simultâneos.
Tempo real inferior a 1 segundo entre disparo e exibição.
Sistema antifraude básico para impedir múltiplas respostas.
Diferencial da Plataforma

A plataforma não deve parecer um sistema de provas.

Ela deve transmitir a sensação de um Centro de Operações de Segurança, utilizando:

Alertas.
Ocorrências.
Simulações.
Decisões rápidas.
Cenários reais.

O aluno deve sentir que está participando ativamente da operação e não apenas assistindo a uma videoaula passiva. Isso aumenta retenção, engajamento e qualidade da aprendizagem, ao mesmo tempo em que gera métricas confiáveis de participação real.