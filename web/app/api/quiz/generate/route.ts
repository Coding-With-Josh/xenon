import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateQuiz, extractQuizParams, type Difficulty, type QuestionType } from "@/lib/ai/quiz";
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
    let {
      topicOrPrompt,
      subject,
      numQuestions = 5,
      difficulty = "waec-standard" as Difficulty,
      questionType = "objective" as QuestionType,
    } = body as {
      topicOrPrompt?: string;
      subject?: string;
      numQuestions?: number;
      difficulty?: Difficulty;
      questionType?: QuestionType;
    };
    const isPrompt = body.isPrompt === true;

    if (!topicOrPrompt || typeof topicOrPrompt !== "string") {
      return NextResponse.json({ error: "topicOrPrompt is required" }, { status: 400 });
    }

    // If it's a natural language prompt, extract params
    if (isPrompt) {
      const extracted = await extractQuizParams(topicOrPrompt);
      if (extracted.subject) subject = extracted.subject;
      if (extracted.numQuestions) numQuestions = extracted.numQuestions;
      if (extracted.difficulty) difficulty = extracted.difficulty;
      if (extracted.questionType) questionType = extracted.questionType;
      if (extracted.topic) topicOrPrompt = extracted.topic;
    }

    const subj = (subject && SUBJECTS.includes(subject as Subject) ? subject : userSubjects[0] ?? "Physics") as Subject;
    const count = Math.min(Math.max(Number(numQuestions) || 5, 1), 50); // Increased max to 50

    const questions = await generateQuiz(topicOrPrompt, classLevel, subj, count, {
      difficulty,
      questionType
    });

    const questionsWithIds = questions.map((q, i) => ({
      ...q,
      id: `q-${i}-${Date.now()}`, // More unique ID
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
