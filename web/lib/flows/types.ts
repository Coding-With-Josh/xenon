import type { Subject, ClassLevel } from "@/lib/curriculum";
// Re-export for convenience
export type { Subject, ClassLevel };

// ── String literal types ──────────────────────────────────────────

export type FlowStage = "hook" | "notes" | "microcheck" | "quiz" | "remediation" | "mastery";
export type FlowStatus = "in_progress" | "completed" | "abandoned";
export type MistakeStatus = "outstanding" | "in_review" | "resolved";
export type MistakeCategory = "concept" | "calculation" | "formula" | "reading" | "careless";

// ── DB model shapes (mirror schema rows after API joins) ──────────

export interface FlowSession {
  id: number;
  slug: string;
  userId: string;
  subject: string;
  topic: string;
  status: FlowStatus;
  currentSubsectionIndex: number;
  currentStage: FlowStage;
  totalSubsections: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export interface FlowStageProgress {
  id: number;
  sessionId: number;
  stage: FlowStage;
  subsectionIndex: number | null;
  completed: boolean;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/** A question_attempts row after joining with quiz_sessions for display */
export interface MistakeAttempt {
  id: number;
  sessionId: number;
  questionId: string;
  question: string;
  correctAnswer: string;
  userAnswer: string | null;
  explanation: string | null;
  correct: boolean;
  subject: string;
  topic: string | null;
  subjectId: string | null;
  topicId: string | null;
  subsectionId: string | null;
  status: MistakeStatus;
  category: MistakeCategory | null;
  attempts: number;
  firstMissedAt: Date | null;
  lastAttemptedAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
}

export interface SpacedReview {
  id: number;
  userId: string;
  subject: string;
  topic: string;
  subsectionId: string | null;
  reviewAt: Date;
  interval: number;
  lastReviewedAt: Date | null;
  createdAt: Date;
}

// ── Stage data payloads (stored in flow_stage_progress.data) ──────

export interface HookData {
  content: string;
}

export interface NotesData {
  subsectionIndex: number;
  content?: string;
}

export interface MicroCheckData {
  questions: MicroCheckQuestion[];
  answers: Record<string, string>;
  score: number;
}

export interface QuizData {
  questions: FlowQuestion[];
  answers: Record<string, string>;
  score: number;
  wrongSubsectionIds: string[];
}

export interface RemediationData {
  subsectionId: string;
  subsectionName: string;
  passed: boolean;
  attempts: number;
}

export interface MasteryContent {
  examTips: string[];
  memoryTechniques: { mnemonic: string; explanation: string }[];
  abbreviations: { abbr: string; meaning: string; context: string }[];
  shortcuts: { title: string; description: string }[];
  keyFormulas: string[];
  flashCards: { front: string; back: string }[];
}

export interface MasteryData {
  content?: MasteryContent;
  completedAt: string;
}

/** Extract typed data from a flow_stage_progress row based on its stage */
export function getStageData<T>(progress: FlowStageProgress): T | null {
  if (!progress.data || Object.keys(progress.data).length === 0) return null;
  return progress.data as T;
}

// ── Question types ────────────────────────────────────────────────

export interface MicroCheckQuestion {
  id: string;
  question: string;
  options: string[];
  correct: string;
  explanation: string;
  subsectionId: string;
}

export interface FlowQuestion {
  id: string;
  question: string;
  type: "objective" | "theory";
  options?: string[];
  correct?: string;
  explanation: string;
  subsectionId: string;
  markingScheme?: { points: string[]; totalMarks: number };
}

// ── Flow API types ────────────────────────────────────────────────

export interface StartFlowRequest {
  subject: Subject;
  topic: string;
  classLevel: ClassLevel;
}

export interface StartFlowResponse {
  session: FlowSession;
  hook: string;
  subsections: { name: string; id: string }[];
}

export interface AdvanceFlowResponse {
  session: FlowSession;
  stageData: unknown;
}

export interface MicroCheckSubmit {
  sessionId: number;
  subsectionIndex: number;
  answers: Record<string, string>;
}

export interface MicroCheckResult {
  pass: boolean;
  score: number;
  total: number;
  wrongAnswers: { questionId: string; correct: string; userAnswer: string }[];
  subsectionId: string;
}

export interface QuizSubmit {
  sessionId: number;
  answers: Record<string, string>;
}

export interface QuizResult {
  score: number;
  total: number;
  wrongAnswers: {
    questionId: string;
    subsectionId: string;
    correct: string;
    userAnswer: string;
  }[];
}

export interface ResumeFlowResponse {
  session: FlowSession;
  currentStageData: Record<string, unknown>;
  subsections: { name: string; id: string }[];
}

// ── Constants ─────────────────────────────────────────────────────

export const FLOW_STAGES: FlowStage[] = [
  "hook",
  "notes",
  "microcheck",
  "quiz",
  "remediation",
  "mastery",
];
