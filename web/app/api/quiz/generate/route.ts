import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateQuiz } from "@/lib/ai/quiz";
import { db } from "@/db";
import { quizSessions } from "@/db/schema";
import type { ClassLevel } from "@/lib/curriculum";
import type { Subject } from "@/lib/curriculum";

const SUBJECTS: Subject[] = ["Physics", "Chemistry", "Biology", "English Language"];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const classLevel = (session.user as { classLevel?: string }).classLevel as ClassLevel | undefined;
  const userSubjects = (session.user as { subjects?: string[] }).subjects ?? [];
  if (!classLevel) {
    return NextResponse.json(
      { error: "Please complete onboarding (set class level)" },
      { status: 400 }
    );
  }
  try {
    const body = await request.json();
    const { topicOrPrompt, subject, numQuestions = 5 } = body as {
      topicOrPrompt?: string;
      subject?: string;
      numQuestions?: number;
    };
    if (!topicOrPrompt || typeof topicOrPrompt !== "string") {
      return NextResponse.json({ error: "topicOrPrompt is required" }, { status: 400 });
    }
    const subj = (subject && SUBJECTS.includes(subject as Subject) ? subject : userSubjects[0] ?? "Physics") as Subject;
    const count = Math.min(Math.max(Number(numQuestions) || 5, 1), 20);
    const questions = await generateQuiz(topicOrPrompt, classLevel, subj, count);
    const questionsWithIds = questions.map((q, i) => ({
      id: `q-${i}`,
      ...q,
    }));
    const [sessionRow] = await db
      .insert(quizSessions)
      .values({
        type: "quiz",
        userId: session.user.id,
        subject: subj,
        topic: topicOrPrompt.slice(0, 200),
        classLevel,
        questions: questionsWithIds,
        totalQuestions: questionsWithIds.length,
      })
      .returning({ id: quizSessions.id });
    return NextResponse.json({
      sessionId: sessionRow?.id,
      questions: questionsWithIds,
    });
  } catch (e) {
    console.error("Quiz generate error:", e);
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 });
  }
}
