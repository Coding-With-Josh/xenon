import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { flowSessions, flowStageProgress, users, curriculum, quizSessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateSubsectionNotes, generateMicroCheck, generateHook } from "@/lib/ai/flows";
import { generateQuiz } from "@/lib/ai/quiz";
import type { Subject, ClassLevel } from "@/lib/curriculum";
import type { FlowStage } from "@/lib/flows/types";
import { dedupe } from "@/lib/utils";

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

    const [flowSession] = await db
      .select()
      .from(flowSessions)
      .where(eq(flowSessions.id, sessionId))
      .limit(1);

    if (!flowSession || flowSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    const classLevel = (user?.classLevel ?? "SS3") as ClassLevel;
    const subject = flowSession.subject as Subject;
    const topic = flowSession.topic;
    const subIndex = flowSession.currentSubsectionIndex;

    // Build subsection lookup
    const curriculumRows = await db
      .select()
      .from(curriculum)
      .where(and(eq(curriculum.subject, subject), eq(curriculum.topic, topic)));
    const subtopics = dedupe(curriculumRows.flatMap((r) => (r.subtopics as string[]) ?? []));
    const subsectionName = subtopics[subIndex] ?? topic;
    const subsectionId = `${subject}-${topic}-${subIndex}`.toLowerCase().replace(/\s+/g, "-");

    let stageData: Record<string, unknown> = {};
    let content: unknown = null;

    switch (flowSession.currentStage) {
      case "hook": {
        const hook = await generateHook(subject, topic, classLevel);
        stageData = { content: hook };
        content = hook;
        break;
      }
      case "notes": {
        const notes = await generateSubsectionNotes(subject, topic, subsectionName, classLevel);
        stageData = { subsectionIndex: subIndex, content: notes };
        content = notes;
        break;
      }
      case "microcheck": {
        const questions = await generateMicroCheck(subject, topic, subsectionName, subsectionId, classLevel);
        stageData = { questions, answers: {}, score: 0 };
        content = questions;
        break;
      }
      case "quiz": {
        // Collect prior questions for this topic to avoid repetition
        const priorQuizSessions = await db
          .select()
          .from(quizSessions)
          .where(
            and(
              eq(quizSessions.userId, session.user.id),
              eq(quizSessions.topic, topic),
              eq(quizSessions.subject, subject),
            )
          );
        const priorQuestions = priorQuizSessions
          .flatMap((qs) => (qs.questions as { question: string }[]) ?? [])
          .map((q) => q.question);

        const quizQuestions = await generateQuiz(topic, classLevel, subject, 10, {
          difficulty: "waec-standard",
          questionType: "objective",
          existingTopics: priorQuestions,
        });
        const taggedQuestions = quizQuestions.map((q, i) => ({
          ...q,
          id: `qz-${topic.toLowerCase().replace(/\s+/g, "-")}-${i}`,
          subsectionId,
        }));
        stageData = { questions: taggedQuestions, answers: {}, score: 0, wrongSubsectionIds: [] };
        content = taggedQuestions;
        break;
      }
      default:
        return NextResponse.json({ error: "Stage does not support generation" }, { status: 400 });
    }

    // Upsert flow stage progress
    const [existing] = await db
      .select()
      .from(flowStageProgress)
      .where(
        and(
          eq(flowStageProgress.sessionId, sessionId),
          eq(flowStageProgress.stage, flowSession.currentStage as FlowStage),
          flowSession.currentStage === "notes" || flowSession.currentStage === "microcheck"
            ? eq(flowStageProgress.subsectionIndex, subIndex)
            : undefined
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(flowStageProgress)
        .set({ data: stageData, updatedAt: new Date() })
        .where(eq(flowStageProgress.id, existing.id));
    } else {
      await db.insert(flowStageProgress).values({
        sessionId,
        stage: flowSession.currentStage as "hook" | "notes" | "microcheck" | "quiz" | "remediation" | "mastery",
        subsectionIndex:
          flowSession.currentStage === "notes" || flowSession.currentStage === "microcheck"
            ? subIndex
            : null,
        data: stageData,
      });
    }

    return NextResponse.json({ stage: flowSession.currentStage, content, subsectionIndex: subIndex });
  } catch (e) {
    console.error("Generate stage error:", e);
    return NextResponse.json({ error: "Failed to generate stage content" }, { status: 500 });
  }
}
