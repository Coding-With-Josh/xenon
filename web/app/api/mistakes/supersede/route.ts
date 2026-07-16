import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { questionAttempts, quizSessions } from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";

/**
 * Auto-resolve outstanding mistakes for a subsection when the student
 * later answers a question on that subsection correctly.
 *
 * Criteria: if the student has at least one correct answer on the same
 * subsection after the most recent mistake, mark the mistake as resolved.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { subsectionId, subject, topic } = body as {
      subsectionId?: string;
      subject?: string;
      topic?: string;
    };
    if (!subsectionId || !subject) {
      return NextResponse.json({ error: "subsectionId and subject required" }, { status: 400 });
    }

    // Find outstanding mistakes for this subsection
    const outstanding = await db
      .select()
      .from(questionAttempts)
      .where(
        and(
          eq(questionAttempts.subsectionId, subsectionId),
          eq(questionAttempts.status, "outstanding")
        )
      )
      .orderBy(desc(questionAttempts.createdAt));

    if (outstanding.length === 0) {
      return NextResponse.json({ resolved: 0 });
    }

    // Check if user has any correct answers on this subsection after the mistakes
    const latestMistakeDate = outstanding[0].createdAt;
    const correctAnswers = await db
      .select()
      .from(questionAttempts)
      .where(
        and(
          eq(questionAttempts.subsectionId, subsectionId),
          eq(questionAttempts.correct, true)
        )
      );

    const hasCorrectAfterMistake = correctAnswers.some(
      (a) => a.createdAt && latestMistakeDate && new Date(a.createdAt) > new Date(latestMistakeDate)
    );

    if (!hasCorrectAfterMistake) {
      return NextResponse.json({ resolved: 0 });
    }

    // Resolve all outstanding mistakes for this subsection
    const ids = outstanding.map((a) => a.id);
    await db
      .update(questionAttempts)
      .set({
        status: "resolved",
        resolvedAt: new Date(),
      })
      .where(inArray(questionAttempts.id, ids));

    return NextResponse.json({ resolved: ids.length });
  } catch (e) {
    console.error("Supersede error:", e);
    return NextResponse.json({ error: "Failed to supersede mistakes" }, { status: 500 });
  }
}
