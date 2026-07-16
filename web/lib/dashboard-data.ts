import { db } from "@/db";
import { flowSessions, questionAttempts, quizSessions } from "@/db/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { getAnalytics } from "./analytics";

export type DashboardData = {
  analytics: Awaited<ReturnType<typeof getAnalytics>>;
  activeFlow: typeof flowSessions.$inferSelect | null;
  recentFlows: (typeof flowSessions.$inferSelect)[];
  mistakesOutstanding: number;
  mistakesResolvedThisWeek: number;
  sessionsThisWeek: number;
};

export async function getDashboardData(userId: string, classLevel?: string): Promise<DashboardData> {
  const analytics = await getAnalytics(userId, classLevel);

  const [activeFlow] = await db
    .select()
    .from(flowSessions)
    .where(and(eq(flowSessions.userId, userId), eq(flowSessions.status, "in_progress")))
    .orderBy(desc(flowSessions.updatedAt))
    .limit(1);

  const recentFlows = await db
    .select()
    .from(flowSessions)
    .where(eq(flowSessions.userId, userId))
    .orderBy(desc(flowSessions.updatedAt))
    .limit(5);

  const [outstandingResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(questionAttempts)
    .innerJoin(quizSessions, eq(questionAttempts.sessionId, quizSessions.id))
    .where(and(eq(quizSessions.userId, userId), eq(questionAttempts.status, "outstanding")));

  const [resolvedResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(questionAttempts)
    .innerJoin(quizSessions, eq(questionAttempts.sessionId, quizSessions.id))
    .where(
      and(
        eq(quizSessions.userId, userId),
        eq(questionAttempts.status, "resolved"),
        gte(questionAttempts.resolvedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      )
    );

  const [sessionsWeekResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(quizSessions)
    .where(
      and(
        eq(quizSessions.userId, userId),
        gte(quizSessions.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      )
    );

  return {
    analytics,
    activeFlow: activeFlow ?? null,
    recentFlows,
    mistakesOutstanding: Number(outstandingResult?.count ?? 0),
    mistakesResolvedThisWeek: Number(resolvedResult?.count ?? 0),
    sessionsThisWeek: Number(sessionsWeekResult?.count ?? 0),
  };
}
