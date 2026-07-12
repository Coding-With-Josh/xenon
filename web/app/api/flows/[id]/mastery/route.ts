import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { flowSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateMastery } from "@/lib/ai/flows";
import type { Subject } from "@/lib/curriculum";

export async function POST(
  _request: Request,
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

    const [flowSession] = await db
      .select()
      .from(flowSessions)
      .where(eq(flowSessions.id, sessionId))
      .limit(1);

    if (!flowSession || flowSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const { users } = await import("@/db/schema");
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    const classLevel = user?.classLevel ?? "SS3";
    const subject = flowSession.subject as Subject;

    const masteryContent = await generateMastery(subject, flowSession.topic, classLevel as any);

    return NextResponse.json(masteryContent);
  } catch (e) {
    console.error("Mastery generation error:", e);
    return NextResponse.json({ error: "Failed to generate mastery content" }, { status: 500 });
  }
}
