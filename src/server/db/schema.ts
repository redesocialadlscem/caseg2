import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
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
  employeeName: text('employee_name').notNull(),
  companyCode: text('company_code').notNull(),
  joinedAt: integer('joined_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  certificateIssued: integer('certificate_issued', { mode: 'boolean' }).notNull().default(false),
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

export type News = typeof news.$inferSelect;
export type NewNews = typeof news.$inferInsert;

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;

export type LiveSession = typeof liveSessions.$inferSelect;
export type NewLiveSession = typeof liveSessions.$inferInsert;

export type LiveSessionParticipant = typeof liveSessionParticipants.$inferSelect;
export type NewLiveSessionParticipant = typeof liveSessionParticipants.$inferInsert;
