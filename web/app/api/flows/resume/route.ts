import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { flowSessions, flowStageProgress, curriculum } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { dedupe } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const [flowSession] = await db
      .select()
      .from(flowSessions)
      .where(and(eq(flowSessions.userId, session.user.id), eq(flowSessions.status, "in_progress")))
      .orderBy(desc(flowSessions.updatedAt))
      .limit(1);

    if (!flowSession) {
      return NextResponse.json({ session: null });
    }

    const [latestProgress] = await db
      .select()
      .from(flowStageProgress)
      .where(eq(flowStageProgress.sessionId, flowSession.id))
      .orderBy(desc(flowStageProgress.updatedAt))
      .limit(1);

    const curriculumRows = await db
      .select()
      .from(curriculum)
      .where(
        and(eq(curriculum.subject, flowSession.subject as any), eq(curriculum.topic, flowSession.topic))
      );
    const subtopics = dedupe(curriculumRows.flatMap((r) => (r.subtopics as string[]) ?? []));
    const subsections = subtopics.map((name, i) => ({
      name,
      id: `${flowSession.subject}-${flowSession.topic}-${i}`
        .toLowerCase()
        .replace(/\s+/g, "-"),
    }));

    return NextResponse.json({
      session: flowSession,
      currentStageData: latestProgress?.data ?? {},
      subsections,
    });
  } catch (e) {
    console.error("Flow resume error:", e);
    return NextResponse.json({ error: "Failed to fetch Flow state" }, { status: 500 });
  }
}
