import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { flowSessions, curriculum } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateHook } from "@/lib/ai/flows";
import { slugify, dedupe } from "@/lib/utils";
import type { Subject, ClassLevel } from "@/lib/curriculum";

function generateUniqueSlug(subject: string, topic: string): string {
  const base = slugify(`${topic}`);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const sessionId = parseInt(id, 10);
  if (isNaN(sessionId)) {
    return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
  }

  try {
    // Fetch existing session and verify ownership
    const [existingSession] = await db
      .select()
      .from(flowSessions)
      .where(eq(flowSessions.id, sessionId))
      .limit(1);

    if (!existingSession) {
      return NextResponse.json({ error: "Flow session not found" }, { status: 404 });
    }

    if (existingSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (existingSession.status !== "in_progress") {
      return NextResponse.json({ error: "Only in-progress flows can be restarted" }, { status: 400 });
    }

    // Mark existing session as abandoned
    await db
      .update(flowSessions)
      .set({
        status: "abandoned",
        updatedAt: new Date(),
      })
      .where(eq(flowSessions.id, sessionId));

    // Fetch curriculum for the new session
    const curriculumRows = await db
      .select()
      .from(curriculum)
      .where(
        and(
          eq(curriculum.subject, existingSession.subject as Subject),
          eq(curriculum.topic, existingSession.topic)
        )
      );
    const subtopics = dedupe(curriculumRows.flatMap((r) => (r.subtopics as string[]) ?? []));
    if (subtopics.length === 0) {
      return NextResponse.json({ error: "No subsections found for this topic" }, { status: 400 });
    }

    // Generate fresh hook
    const classLevel = (session.user as { classLevel?: string }).classLevel ?? "SS1";
    const hook = await generateHook(
      existingSession.subject as Subject,
      existingSession.topic,
      classLevel as ClassLevel
    );

    // Create new session
    const slug = generateUniqueSlug(existingSession.subject, existingSession.topic);
    const [newSession] = await db
      .insert(flowSessions)
      .values({
        slug,
        userId: session.user.id,
        subject: existingSession.subject,
        topic: existingSession.topic,
        totalSubsections: subtopics.length,
      })
      .returning();

    return NextResponse.json({
      session: newSession,
      hook,
      subsections: subtopics.map((name, i) => ({
        name,
        id: `${existingSession.subject}-${existingSession.topic}-${i}`.toLowerCase().replace(/\s+/g, "-"),
      })),
    });
  } catch (e) {
    console.error("Flow restart error:", e);
    return NextResponse.json({ error: "Failed to restart Flow" }, { status: 500 });
  }
}