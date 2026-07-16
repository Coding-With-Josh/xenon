import { db } from "@/db";
import { flowSessions, flowStageProgress } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { FlowStage } from "@/lib/flows/types";

export type FlowListItem = {
  id: number;
  slug: string;
  subject: string;
  topic: string;
  status: "in_progress" | "completed" | "abandoned";
  currentStage: FlowStage;
  currentSubsectionIndex: number;
  totalSubsections: number;
  quizScore: number | null;
  quizTotal: number | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
};

export type UserFlowsData = {
  inProgress: FlowListItem[];
  completed: Record<string, FlowListItem[]>;
  abandoned: FlowListItem[];
};

export async function getUserFlows(userId: string): Promise<UserFlowsData> {
  const rows = await db
    .select({
      id: flowSessions.id,
      slug: flowSessions.slug,
      subject: flowSessions.subject,
      topic: flowSessions.topic,
      status: flowSessions.status,
      currentStage: flowSessions.currentStage,
      currentSubsectionIndex: flowSessions.currentSubsectionIndex,
      totalSubsections: flowSessions.totalSubsections,
      createdAt: flowSessions.createdAt,
      updatedAt: flowSessions.updatedAt,
      completedAt: flowSessions.completedAt,
    })
    .from(flowSessions)
    .where(eq(flowSessions.userId, userId))
    .orderBy(desc(flowSessions.updatedAt));

  // Get quiz scores for completed flows
  const completedIds = rows
    .filter((r) => r.status === "completed")
    .map((r) => r.id);

  const quizScoresMap = new Map<number, { score: number; total: number }>();

  if (completedIds.length > 0) {
    const quizProgress = await db
      .select({
        sessionId: flowStageProgress.sessionId,
        data: flowStageProgress.data,
      })
      .from(flowStageProgress)
      .where(
        and(
          eq(flowStageProgress.stage, "quiz"),
          sql`${flowStageProgress.sessionId} IN (${sql.join(completedIds, sql`,`)})`
        )
      );

    for (const qp of quizProgress) {
      const d = qp.data as { score?: number; total?: number } | null;
      if (d && typeof d.score === "number" && typeof d.total === "number") {
        quizScoresMap.set(qp.sessionId, { score: d.score, total: d.total });
      }
    }
  }

  const items: FlowListItem[] = rows.map((r) => {
    const quiz = quizScoresMap.get(r.id);
    return {
      id: r.id,
      slug: r.slug,
      subject: r.subject,
      topic: r.topic,
      status: r.status as FlowListItem["status"],
      currentStage: r.currentStage as FlowStage,
      currentSubsectionIndex: r.currentSubsectionIndex,
      totalSubsections: r.totalSubsections,
      quizScore: quiz?.score ?? null,
      quizTotal: quiz?.total ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      completedAt: r.completedAt,
    };
  });

  // Deduplicate in-progress flows: keep only the most recently updated per subject+topic
  const seenTopics = new Set<string>();
  const inProgress: FlowListItem[] = [];
  for (const i of items) {
    if (i.status === "in_progress") {
      const key = `${i.subject}::${i.topic}`;
      if (seenTopics.has(key)) continue; // skip duplicate — keep the first (most recent by ORDER BY)
      seenTopics.add(key);
      inProgress.push(i);
    }
  }

  const abandoned = items.filter((i) => i.status === "abandoned");
  const completed = items.filter((i) => i.status === "completed");

  // Group completed by subject
  const completedGrouped: Record<string, FlowListItem[]> = {};
  for (const c of completed) {
    if (!completedGrouped[c.subject]) completedGrouped[c.subject] = [];
    completedGrouped[c.subject].push(c);
  }

  return { inProgress, completed: completedGrouped, abandoned };
}

/**
 * Get the set of topics that the user already has in-progress flows for.
 * Used to exclude these from the "Start new flow" picker.
 */
export async function getUserInProgressTopics(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ subject: flowSessions.subject, topic: flowSessions.topic })
    .from(flowSessions)
    .where(
      and(eq(flowSessions.userId, userId), eq(flowSessions.status, "in_progress"))
    );

  return new Set(rows.map((r) => `${r.subject}::${r.topic}`));
}

/**
 * Get the set of topics the user has completed flows for.
 * Used to show "Previously completed" note in the picker.
 */
export async function getUserCompletedTopics(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ subject: flowSessions.subject, topic: flowSessions.topic })
    .from(flowSessions)
    .where(
      and(eq(flowSessions.userId, userId), eq(flowSessions.status, "completed"))
    );

  return new Set(rows.map((r) => `${r.subject}::${r.topic}`));
}