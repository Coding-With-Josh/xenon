import { db } from "@/db";
import { quizSessions, questionAttempts, generatedContent, curriculum } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

const WEAK_THRESHOLD = 0.6;
const PRIOR_WEIGHT = 15;
const PRIOR_MEAN = 0.5;
const MIN_QUESTIONS = 20;

export async function getAnalytics(userId: string, classLevel?: string) {
  const sessions = await db
    .select({
      id: quizSessions.id,
      subject: quizSessions.subject,
      topic: quizSessions.topic,
      score: quizSessions.score,
      totalQuestions: quizSessions.totalQuestions,
      createdAt: quizSessions.createdAt,
    })
    .from(quizSessions)
    .where(eq(quizSessions.userId, userId))
    .orderBy(desc(quizSessions.createdAt));

  const attempts = await db
    .select({
      sessionId: questionAttempts.sessionId,
      correct: questionAttempts.correct,
    })
    .from(questionAttempts)
    .innerJoin(quizSessions, eq(questionAttempts.sessionId, quizSessions.id))
    .where(eq(quizSessions.userId, userId));

  const topicStats: Record<string, { correct: number; total: number }> = {};
  for (const a of attempts) {
    const sess = sessions.find((s) => s.id === a.sessionId);
    const topic = sess?.topic || sess?.subject || "General";
    if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
    topicStats[topic].total += 1;
    if (a.correct) topicStats[topic].correct += 1;
  }
  const weakTopics = Object.entries(topicStats)
    .filter(([, s]) => s.total >= 3 && s.correct / s.total < WEAK_THRESHOLD)
    .map(([topic]) => topic);

  const notesRows = await db
    .select({ id: generatedContent.id })
    .from(generatedContent)
    .where(and(eq(generatedContent.userId, userId), eq(generatedContent.type, "notes")));
  const notesCount = notesRows.length;

  const recentSessionsForChart = sessions.slice(0, 14).map((s) => {
    const pct = s.totalQuestions && s.score != null
      ? Math.round((s.score / s.totalQuestions) * 100)
      : 0;
    return {
      date: s.createdAt?.toISOString().slice(0, 10) ?? "",
      accuracy: pct,
      topic: s.topic || s.subject,
    };
  }).reverse();

  const totalCorrect = sessions.reduce((sum, s) => sum + (s.score ?? 0), 0);
  const totalQuestions = sessions.reduce((sum, s) => sum + (s.totalQuestions ?? 0), 0);
  const rawAccuracy = totalQuestions ? totalCorrect / totalQuestions : 0;

  // Bayesian smoothing: blend raw accuracy toward neutral prior when sample is small
  const adjustedAccuracy = (totalCorrect + PRIOR_WEIGHT * PRIOR_MEAN) / (totalQuestions + PRIOR_WEIGHT);

  const strengths = Object.entries(topicStats)
    .filter(([, s]) => s.total >= 5 && s.correct / s.total >= 0.8)
    .map(([topic]) => topic);

  // Total syllabus topics across all subjects, filtered by class level
  let totalSyllabusTopics = 0;
  if (classLevel) {
    const allTopics = await db
      .select({ classLevels: curriculum.classLevels })
      .from(curriculum);
    totalSyllabusTopics = allTopics.filter((r) => {
      const levels = (r.classLevels as string[]) ?? [];
      return levels.includes(classLevel);
    }).length;
  }
  const distinctTopicsAttempted = Object.keys(topicStats).length;
  const coverageRatio = totalSyllabusTopics > 0 ? distinctTopicsAttempted / totalSyllabusTopics : 0;

  const examReadiness = totalQuestions < MIN_QUESTIONS
    ? null
    : Math.min(100, Math.round(adjustedAccuracy * 70 + coverageRatio * 15 + strengths.length * 3));

  const overallAccuracy = Math.round(rawAccuracy * 100);

  const dates = new Set(sessions.map((s) => s.createdAt?.toISOString().slice(0, 10)).filter(Boolean));
  const sortedDates = Array.from(dates).sort();
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  for (let i = sortedDates.length - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - streak);
    const expected = d.toISOString().slice(0, 10);
    if (sortedDates[i] === expected) streak++;
    else break;
  }

  return {
    totalQuizzes: sessions.length,
    totalQuestions,
    totalCorrect,
    overallAccuracy,
    examReadiness,
    strengths,
    weakTopics,
    totalSyllabusTopics,
    distinctTopicsAttempted,
    topicStats: Object.fromEntries(
      Object.entries(topicStats).map(([k, v]) => [
        k,
        { correct: v.correct, total: v.total, accuracy: Math.round((v.correct / v.total) * 100) },
      ])
    ),
    streak,
    notesCount,
    recentSessionsForChart,
  };
}
