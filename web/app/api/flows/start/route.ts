import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { curriculum, flowSessions, flowStageProgress } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateHook } from "@/lib/ai/flows";
import type { Subject, ClassLevel } from "@/lib/curriculum";
import { slugify, dedupe } from "@/lib/utils";

function generateUniqueSlug(subject: string, topic: string): string {
  const base = slugify(`${topic}`);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { subject, topic, classLevel } = body as {
      subject?: Subject;
      topic?: string;
      classLevel?: ClassLevel;
    };
    if (!subject || !topic || !classLevel) {
      return NextResponse.json({ error: "subject, topic, and classLevel required" }, { status: 400 });
    }

    // Server-side guard: prevent duplicate in-progress flows for same subject+topic
    const [existingInProgress] = await db
      .select({ id: flowSessions.id })
      .from(flowSessions)
      .where(
        and(
          eq(flowSessions.userId, session.user.id),
          eq(flowSessions.subject, subject),
          eq(flowSessions.topic, topic),
          eq(flowSessions.status, "in_progress")
        )
      )
      .limit(1);

    if (existingInProgress) {
      return NextResponse.json(
        { error: "You already have an in-progress Flow on this topic" },
        { status: 409 }
      );
    }

    const curriculumRows = await db
      .select()
      .from(curriculum)
      .where(and(eq(curriculum.subject, subject), eq(curriculum.topic, topic)));
    const subtopics = dedupe(curriculumRows.flatMap((r) => (r.subtopics as string[]) ?? []));
    if (subtopics.length === 0) {
      return NextResponse.json({ error: "No subsections found for this topic" }, { status: 400 });
    }

    const hook = await generateHook(subject, topic, classLevel);

    const slug = generateUniqueSlug(subject, topic);

    const [sessionRow] = await db
      .insert(flowSessions)
      .values({
        slug,
        userId: session.user.id,
        subject,
        topic,
        totalSubsections: subtopics.length,
      })
      .returning();

    await db.insert(flowStageProgress).values({
      sessionId: sessionRow.id,
      stage: "hook",
      subsectionIndex: null,
      completed: true,
      data: { content: hook },
    });

    const subsections = subtopics.map((name, i) => ({
      name,
      id: `${subject}-${topic}-${i}`.toLowerCase().replace(/\s+/g, "-"),
    }));

    return NextResponse.json({ session: sessionRow, hook, subsections });
  } catch (e) {
    console.error("Flow start error:", e);
    return NextResponse.json({ error: "Failed to start Flow" }, { status: 500 });
  }
}
