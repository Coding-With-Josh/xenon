import { db } from "@/db";
import {
  users,
  quizSessions,
  generatedContent,
  uploads,
  chatSessions,
  studyActivity,
} from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function getAdminStats() {
  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      classLevel: users.classLevel,
      subjects: users.subjects,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  const quizCountByUser = await db
    .select({
      userId: quizSessions.userId,
      count: sql<number>`count(*)::int`,
      exams: sql<number>`count(*) filter (where ${quizSessions.type} = 'exam')::int`,
      quizzes: sql<number>`count(*) filter (where ${quizSessions.type} = 'quiz')::int`,
    })
    .from(quizSessions)
    .groupBy(quizSessions.userId);

  const notesCountByUser = await db
    .select({
      userId: generatedContent.userId,
      count: sql<number>`count(*)::int`,
    })
    .from(generatedContent)
    .where(eq(generatedContent.type, "notes"))
    .groupBy(generatedContent.userId);

  const chatCountByUser = await db
    .select({
      userId: chatSessions.userId,
      count: sql<number>`count(*)::int`,
    })
    .from(chatSessions)
    .groupBy(chatSessions.userId);

  const uploadCountByUser = await db
    .select({
      userId: uploads.userId,
      count: sql<number>`count(*)::int`,
    })
    .from(uploads)
    .groupBy(uploads.userId);

  const quizScoresByUser = await db
    .select({
      userId: quizSessions.userId,
      totalCorrect: sql<number>`coalesce(sum(${quizSessions.score}), 0)::int`,
      totalQuestions: sql<number>`coalesce(sum(${quizSessions.totalQuestions}), 0)::int`,
    })
    .from(quizSessions)
    .groupBy(quizSessions.userId);

  const recentQuizzes = await db
    .select({
      id: quizSessions.id,
      userId: quizSessions.userId,
      type: quizSessions.type,
      subject: quizSessions.subject,
      topic: quizSessions.topic,
      score: quizSessions.score,
      totalQuestions: quizSessions.totalQuestions,
      createdAt: quizSessions.createdAt,
    })
    .from(quizSessions)
    .orderBy(desc(quizSessions.createdAt))
    .limit(100);

  const recentNotes = await db
    .select({
      id: generatedContent.id,
      userId: generatedContent.userId,
      subject: generatedContent.subject,
      topic: generatedContent.topic,
      createdAt: generatedContent.createdAt,
    })
    .from(generatedContent)
    .where(eq(generatedContent.type, "notes"))
    .orderBy(desc(generatedContent.createdAt))
    .limit(50);

  const recentChatSessions = await db
    .select({
      id: chatSessions.id,
      userId: chatSessions.userId,
      title: chatSessions.title,
      updatedAt: chatSessions.updatedAt,
    })
    .from(chatSessions)
    .orderBy(desc(chatSessions.updatedAt))
    .limit(50);

  const recentUploads = await db
    .select({
      id: uploads.id,
      userId: uploads.userId,
      type: uploads.type,
      createdAt: uploads.createdAt,
    })
    .from(uploads)
    .orderBy(desc(uploads.createdAt))
    .limit(50);

  const studyActivityByUser = await db
    .select({
      userId: studyActivity.userId,
      activityDate: studyActivity.activityDate,
    })
    .from(studyActivity);

  const quizDatesRows = await db
    .select({
      userId: quizSessions.userId,
      createdAt: quizSessions.createdAt,
    })
    .from(quizSessions);

  const userMap = Object.fromEntries(allUsers.map((u) => [u.id, u]));
  const quizMap = Object.fromEntries(quizCountByUser.map((r) => [r.userId, r]));
  const notesMap = Object.fromEntries(notesCountByUser.map((r) => [r.userId, r]));
  const chatMap = Object.fromEntries(chatCountByUser.map((r) => [r.userId, r]));
  const uploadMap = Object.fromEntries(uploadCountByUser.map((r) => [r.userId, r]));
  const scoresMap = Object.fromEntries(quizScoresByUser.map((r) => [r.userId, r]));

  const datesByUser: Record<string, Set<string>> = {};
  for (const r of studyActivityByUser) {
    if (!datesByUser[r.userId]) datesByUser[r.userId] = new Set();
    datesByUser[r.userId].add(new Date(r.activityDate).toISOString().slice(0, 10));
  }
  for (const r of quizDatesRows) {
    if (!datesByUser[r.userId]) datesByUser[r.userId] = new Set();
    if (r.createdAt) datesByUser[r.userId].add(new Date(r.createdAt).toISOString().slice(0, 10));
  }

  function computeStreak(dates: string[]): number {
    if (!dates?.length) return 0;
    const sorted = [...new Set(dates)].sort();
    let streak = 0;
    const today = new Date().toISOString().slice(0, 10);
    for (let i = sorted.length - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - streak);
      const expected = d.toISOString().slice(0, 10);
      if (sorted[i] === expected) streak++;
      else break;
    }
    return streak;
  }

  const streaks: { userId: string; streak: number }[] = [];
  for (const u of allUsers) {
    const allDates = [...(datesByUser[u.id] ?? [])];
    const streak = computeStreak(allDates);
    if (streak > 0) streaks.push({ userId: u.id, streak });
  }
  streaks.sort((a, b) => b.streak - a.streak);

  const usersWithStats = allUsers.map((u) => {
    const q = quizMap[u.id];
    const n = notesMap[u.id];
    const c = chatMap[u.id];
    const up = uploadMap[u.id];
    const sc = scoresMap[u.id];
    const totalQ = sc?.totalQuestions ?? 0;
    const totalC = sc?.totalCorrect ?? 0;
    const accuracy = totalQ ? Math.round((totalC / totalQ) * 100) : 0;
    const streakRow = streaks.find((s) => s.userId === u.id);
    return {
      ...u,
      quizCount: q?.count ?? 0,
      examCount: q?.exams ?? 0,
      notesCount: n?.count ?? 0,
      chatCount: c?.count ?? 0,
      uploadCount: up?.count ?? 0,
      accuracy,
      streak: streakRow?.streak ?? 0,
    };
  });

  return {
    overview: {
      totalUsers: allUsers.length,
      totalQuizzes: quizCountByUser.reduce((s, r) => s + (r.quizzes ?? 0), 0),
      totalExams: quizCountByUser.reduce((s, r) => s + (r.exams ?? 0), 0),
      totalNotes: notesCountByUser.reduce((s, r) => s + r.count, 0),
      totalChatSessions: chatCountByUser.reduce((s, r) => s + r.count, 0),
      totalUploads: uploadCountByUser.reduce((s, r) => s + r.count, 0),
      usersWithStreak: streaks.length,
    },
    users: usersWithStats,
    streaks: streaks.map((s) => ({
      userId: s.userId,
      email: userMap[s.userId]?.email,
      name: userMap[s.userId]?.name,
      streak: s.streak,
    })),
    recentQuizzes: recentQuizzes.map((r) => ({
      ...r,
      email: userMap[r.userId]?.email,
      name: userMap[r.userId]?.name,
    })),
    recentNotes: recentNotes.map((r) => ({
      ...r,
      email: userMap[r.userId]?.email,
      name: userMap[r.userId]?.name,
    })),
    recentChatSessions: recentChatSessions.map((r) => ({
      ...r,
      email: userMap[r.userId]?.email,
      name: userMap[r.userId]?.name,
    })),
    recentUploads: recentUploads.map((r) => ({
      ...r,
      email: userMap[r.userId]?.email,
      name: userMap[r.userId]?.name,
    })),
  };
}

export type AdminStats = Awaited<ReturnType<typeof getAdminStats>>;
