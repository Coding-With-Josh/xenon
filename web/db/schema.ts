import {
  pgTable,
  text,
  timestamp,
  serial,
  integer,
  json,
  pgEnum,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";

// Class levels: JSS1–JSS3, SS1–SS3
export const classLevelEnum = pgEnum("class_level", [
  "JSS1",
  "JSS2",
  "JSS3",
  "SS1",
  "SS2",
  "SS3",
]);

// Subjects
export const subjectsEnum = pgEnum("subject", [
  "Physics",
  "Chemistry",
  "Biology",
  "English Language",
]);

// Generated content types
export const generatedContentTypeEnum = pgEnum("generated_content_type", [
  "notes",
  "quiz",
  "summary",
]);

// Upload types
export const uploadTypeEnum = pgEnum("upload_type", ["pdf", "image", "video"]);

// Session types (quiz vs exam)
export const sessionTypeEnum = pgEnum("session_type", ["quiz", "exam"]);

// --- NextAuth tables (compatible with @auth/drizzle-adapter) ---
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  // Xenon profile
  classLevel: classLevelEnum("class_level"),
  subjects: json("subjects").$type<string[]>().default([]),
  examType: text("exam_type"), // WAEC, JAMB, etc.
  examDate: timestamp("exam_date", { mode: "date" }),
  passwordHash: text("password_hash"), // for credentials provider
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// --- Curriculum: subject → topic → subtopics → class level ---
export const curriculum = pgTable("curriculum", {
  id: serial("id").primaryKey(),
  subject: subjectsEnum("subject").notNull(),
  topic: text("topic").notNull(),
  subtopics: json("subtopics").$type<string[]>().default([]),
  classLevels: json("class_levels").$type<string[]>().notNull(), // e.g. ["SS1", "SS2"]
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const studyPlans = pgTable("study_plans", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planDate: timestamp("plan_date", { mode: "date" }).notNull(), // Day of the plan
  tasks: json("tasks").$type<{
    subject: string;
    topic: string;
    type: "notes" | "quiz" | "practice";
    completed: boolean;
  }[]>().notNull().default([]),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// --- Generated content (notes, quiz, summary) ---
export const generatedContent = pgTable("generated_content", {
  id: serial("id").primaryKey(),
  type: generatedContentTypeEnum("type").notNull(),
  subject: text("subject").notNull(),
  topic: text("topic"),
  classLevel: classLevelEnum("class_level"),
  content: json("content").$type<unknown>().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  uploadId: integer("upload_id"), // optional link to upload
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// --- Quiz and Exam sessions ---
export const quizSessions = pgTable("quiz_sessions", {
  id: serial("id").primaryKey(),
  type: sessionTypeEnum("type").notNull().default("quiz"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  topic: text("topic"),
  classLevel: classLevelEnum("class_level"),
  questions: json("questions").$type<unknown>().notNull(),
  answers: json("answers").$type<Record<string, unknown>>().default({}),
  score: integer("score"),
  totalQuestions: integer("total_questions").notNull(),
  timeSpentSeconds: integer("time_spent_seconds"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// --- Question attempts (for corrections and mistake review) ---
export const questionAttempts = pgTable("question_attempts", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => quizSessions.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull(),
  userAnswer: text("user_answer"),
  correct: boolean("correct").notNull(),
  explanation: text("explanation"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// --- Uploads (PDF, image, video) ---
export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: uploadTypeEnum("type").notNull(),
  url: text("url").notNull(),
  extractedText: text("extracted_text"),
  summary: text("summary"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// --- Study activity for streak (optional: one row per user per day) ---
export const studyActivity = pgTable("study_activity", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  activityDate: timestamp("activity_date", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// --- Chat sessions (Xe AI conversation history) ---
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(), // first message snippet
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
