import { db } from "@/db";
import { quizSessions, questionAttempts, generatedContent } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

const WEAK_THRESHOLD = 0.6;

export async function getAnalytics(userId: string) {
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
  const overallAccuracy = totalQuestions ? totalCorrect / totalQuestions : 0;

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
    overallAccuracy: Math.round(overallAccuracy * 100),
    weakTopics,
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
