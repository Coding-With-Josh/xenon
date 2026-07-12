import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { flowSessions, curriculum } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateRemediation } from "@/lib/ai/flows";
import type { Subject } from "@/lib/curriculum";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const sessionId = Number(id);
    if (Number.isNaN(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
    }

    const body = await request.json();
    const { subsectionId, subsectionName, previousAttempt } = body as {
      subsectionId?: string;
      subsectionName?: string;
      previousAttempt?: { question: string; userAnswer: string; correctAnswer: string };
    };
    if (!subsectionId || !subsectionName) {
      return NextResponse.json({ error: "subsectionId and subsectionName required" }, { status: 400 });
    }

    const [flowSession] = await db
      .select()
      .from(flowSessions)
      .where(eq(flowSessions.id, sessionId))
      .limit(1);

    if (!flowSession || flowSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get user's classLevel for AI generation
    const { users } = await import("@/db/schema");
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    const classLevel = user?.classLevel ?? "SS3";
    const subject = flowSession.subject as Subject;

    const result = await generateRemediation(
      subject,
      flowSession.topic,
      subsectionName,
      subsectionId,
      classLevel as any,
      previousAttempt
    );

    return NextResponse.json(result);
  } catch (e) {
    console.error("Remediation error:", e);
    return NextResponse.json({ error: "Failed to generate remediation" }, { status: 500 });
  }
}
