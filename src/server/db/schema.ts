import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  cpf: text('cpf').notNull().default(''), // CPF do trabalhador (conformidade NR)
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['student', 'admin'] }).notNull().default('student'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Courses ─────────────────────────────────────────────────────────────────
export const courses = sqliteTable('courses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  category: text('category').notNull().default(''),
  durationHours: real('duration_hours').notNull().default(0),
  imageUrl: text('image_url').notNull().default(''),
  price: real('price').notNull().default(0),
  isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  // Data da última atualização/revisão do conteúdo (conformidade NR — manter o
  // treinamento alinhado à versão vigente da norma).
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  // Conformidade NR
  nrReference: text('nr_reference').notNull().default(''),       // ex.: "NR-35"
  validityMonths: integer('validity_months').notNull().default(0), // validade do certificado (0 = sem validade)
  instructorName: text('instructor_name').notNull().default(''),  // instrutor responsável
  instructorTitle: text('instructor_title').notNull().default(''),// qualificação/registro do instrutor
});

// ─── Modules ─────────────────────────────────────────────────────────────────
export const modules = sqliteTable('modules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  courseId: integer('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  orderIndex: integer('order_index').notNull().default(0),
});

// ─── Lessons ─────────────────────────────────────────────────────────────────
export const lessons = sqliteTable('lessons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  moduleId: integer('module_id')
    .notNull()
    .references(() => modules.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull().default(''),
  videoUrl: text('video_url').notNull().default(''),
  orderIndex: integer('order_index').notNull().default(0),
});

// ─── Progress ────────────────────────────────────────────────────────────────
export const progress = sqliteTable('progress', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  lessonId: integer('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

// ─── Certificates ────────────────────────────────────────────────────────────
export const certificates = sqliteTable('certificates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  courseId: integer('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  issuedAt: integer('issued_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  pdfPath: text('pdf_path').notNull().default(''),
});

// ─── Enrollments (Matrículas / posse de curso) ───────────────────────────────
export const enrollments = sqliteTable(
  'enrollments',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: integer('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    // Como o aluno obteve acesso ao curso
    source: text('source', { enum: ['purchase', 'free', 'admin', 'corporate'] })
      .notNull()
      .default('purchase'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    // Um aluno só pode estar matriculado uma vez por curso
    userCourseUnique: uniqueIndex('enrollments_user_course_unique').on(
      table.userId,
      table.courseId,
    ),
  }),
);

// ─── Payments (Pagamentos / idempotência do webhook) ─────────────────────────
export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull().default('mercadopago'),
  // ID do pagamento no provedor — UNIQUE garante idempotência (não processa 2x)
  providerPaymentId: text('provider_payment_id').notNull().unique(),
  preferenceId: text('preference_id').notNull().default(''),
  status: text('status').notNull().default('pending'), // pending | approved | rejected | refunded | cancelled
  amount: real('amount').notNull().default(0),
  courseIds: text('course_ids').notNull().default('[]'), // JSON array de IDs
  rawPayload: text('raw_payload').notNull().default(''), // payload bruto do webhook (auditoria)
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── News ────────────────────────────────────────────────────────────────────
export const news = sqliteTable('news', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  summary: text('summary').notNull().default(''),
  sourceUrl: text('source_url').notNull().default(''),
  publishedAt: integer('published_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Settings ────────────────────────────────────────────────────────────────
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull().default(''),
});

// ─── Live Sessions ───────────────────────────────────────────────────────────
export const liveSessions = sqliteTable('live_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  courseName: text('course_name').notNull().default(''),
  companyCode: text('company_code').notNull(),
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }).notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(60),
  status: text('status', { enum: ['scheduled', 'live', 'completed', 'cancelled'] }).notNull().default('scheduled'),
  jitsiRoom: text('jitsi_room').notNull().default(''),
  // Regras configuráveis de certificação (0 = regra desativada)
  certMinAttendancePct: integer('cert_min_attendance_pct').notNull().default(0),
  certMinAttentionPct: integer('cert_min_attention_pct').notNull().default(0),
  certMinResponsePct: integer('cert_min_response_pct').notNull().default(0),
  // Conformidade NR (vão para o certificado da aula ao vivo)
  nrReference: text('nr_reference').notNull().default(''),
  validityMonths: integer('validity_months').notNull().default(0),
  instructorName: text('instructor_name').notNull().default(''),
  instructorTitle: text('instructor_title').notNull().default(''),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Live Session Participants ───────────────────────────────────────────────
export const liveSessionParticipants = sqliteTable('live_session_participants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id')
    .notNull()
    .references(() => liveSessions.id, { onDelete: 'cascade' }),
  employeeName: text('employee_name').notNull(), // identificador (nome da chamada)
  fullName: text('full_name').notNull().default(''), // nome completo para o certificado
  cpf: text('cpf').notNull().default(''), // CPF para o certificado (conformidade NR)
  companyCode: text('company_code').notNull(),
  joinedAt: integer('joined_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  certificateIssued: integer('certificate_issued', { mode: 'boolean' }).notNull().default(false),
  // Presença acumulada (segundos de tempo conectado, via heartbeat)
  presenceSeconds: integer('presence_seconds').notNull().default(0),
  lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }),
});

// ─── Exam Questions (Provas) ─────────────────────────────────────────────────
export const examQuestions = sqliteTable('exam_questions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  lessonId: integer('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  options: text('options').notNull(), // JSON array of strings
  correctAnswer: integer('correct_answer').notNull(), // index of correct option
  orderIndex: integer('order_index').notNull().default(0),
});

// ─── Activities (Atividades Formativas) ──────────────────────────────────────
export const activities = sqliteTable('activities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  lessonId: integer('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  options: text('options').notNull(), // JSON array of strings
  correctAnswer: integer('correct_answer').notNull(), // index of correct option
  orderIndex: integer('order_index').notNull().default(0),
});

// ─── Activity Attempts ───────────────────────────────────────────────────────
export const activityAttempts = sqliteTable('activity_attempts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  activityId: integer('activity_id')
    .notNull()
    .references(() => activities.id, { onDelete: 'cascade' }),
  answers: text('answers').notNull(), // JSON array of selected indices
  score: real('score').notNull().default(0), // percentage
  completedAt: integer('completed_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Exam Attempts ───────────────────────────────────────────────────────────
export const examAttempts = sqliteTable('exam_attempts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  lessonId: integer('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  answers: text('answers').notNull(), // JSON array of selected indices
  score: real('score').notNull().default(0), // percentage
  passed: integer('passed', { mode: 'boolean' }).notNull().default(false),
  timeSpentSeconds: integer('time_spent_seconds').notNull().default(0),
  completedAt: integer('completed_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Lesson Config (timer, passing score, etc.) ──────────────────────────────
export const lessonConfigs = sqliteTable('lesson_configs', {
  lessonId: integer('lesson_id')
    .primaryKey()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  hasActivity: integer('has_activity', { mode: 'boolean' }).notNull().default(false),
  hasExam: integer('has_exam', { mode: 'boolean' }).notNull().default(false),
  examDurationMinutes: integer('exam_duration_minutes').notNull().default(30),
  examPassingScore: real('exam_passing_score').notNull().default(70), // percentage
  activityDurationMinutes: integer('activity_duration_minutes').notNull().default(15),
});

// ─── Forum Topics ────────────────────────────────────────────────────────────
export const forumTopics = sqliteTable('forum_topics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  courseId: integer('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
  isLocked: integer('is_locked', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Forum Replies ───────────────────────────────────────────────────────────
export const forumReplies = sqliteTable('forum_replies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  topicId: integer('topic_id')
    .notNull()
    .references(() => forumTopics.id, { onDelete: 'cascade' }),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  parentReplyId: integer('parent_reply_id'),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Forum Likes ─────────────────────────────────────────────────────────────
export const forumLikes = sqliteTable('forum_likes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  targetType: text('target_type', { enum: ['topic', 'reply'] }).notNull(),
  targetId: integer('target_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Interactions (Banco de Interações — Aula Interativa) ────────────────────
export const interactions = sqliteTable('interactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type', { enum: ['quiz', 'truefalse', 'poll', 'keyword', 'flash'] }).notNull(),
  question: text('question').notNull(),
  options: text('options').notNull().default('[]'), // JSON array de strings
  correctAnswer: integer('correct_answer'), // índice da correta; null para enquete/keyword/flash
  correctText: text('correct_text'), // JSON array de respostas aceitas (keyword); null nos demais
  timeLimitSeconds: integer('time_limit_seconds').notNull().default(20),
  category: text('category').notNull().default(''),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Session Interactions (interações ativadas numa aula) ────────────────────
export const sessionInteractions = sqliteTable('session_interactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id')
    .notNull()
    .references(() => liveSessions.id, { onDelete: 'cascade' }),
  interactionId: integer('interaction_id')
    .notNull()
    .references(() => interactions.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['pending', 'open', 'closed'] }).notNull().default('pending'),
  orderIndex: integer('order_index').notNull().default(0),
  openedAt: integer('opened_at', { mode: 'timestamp' }),
  closedAt: integer('closed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Interaction Responses ───────────────────────────────────────────────────
export const interactionResponses = sqliteTable(
  'interaction_responses',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sessionInteractionId: integer('session_interaction_id')
      .notNull()
      .references(() => sessionInteractions.id, { onDelete: 'cascade' }),
    participantName: text('participant_name').notNull(),
    answer: integer('answer').notNull().default(0), // índice da opção (0 p/ keyword/flash)
    answerText: text('answer_text'), // resposta digitada (keyword); null nos demais
    isCorrect: integer('is_correct', { mode: 'boolean' }),
    responseMs: integer('response_ms').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    // Antifraude: uma resposta por participante por ativação
    uniqueResponse: uniqueIndex('interaction_responses_unique').on(
      table.sessionInteractionId,
      table.participantName,
    ),
  }),
);

// ─── Types ───────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;

export type Module = typeof modules.$inferSelect;
export type NewModule = typeof modules.$inferInsert;

export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;

export type Progress = typeof progress.$inferSelect;
export type NewProgress = typeof progress.$inferInsert;

export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;

export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type Interaction = typeof interactions.$inferSelect;
export type NewInteraction = typeof interactions.$inferInsert;

export type SessionInteraction = typeof sessionInteractions.$inferSelect;
export type NewSessionInteraction = typeof sessionInteractions.$inferInsert;

export type InteractionResponse = typeof interactionResponses.$inferSelect;
export type NewInteractionResponse = typeof interactionResponses.$inferInsert;

export type News = typeof news.$inferSelect;
export type NewNews = typeof news.$inferInsert;

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;

export type LiveSession = typeof liveSessions.$inferSelect;
export type NewLiveSession = typeof liveSessions.$inferInsert;

export type LiveSessionParticipant = typeof liveSessionParticipants.$inferSelect;
export type NewLiveSessionParticipant = typeof liveSessionParticipants.$inferInsert;
