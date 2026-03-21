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
      subject,
      numQuestions = 25,
      topic = null,
      difficulty = "waec-standard" as Difficulty,
      questionType = "mixed" as QuestionType,
    } = body as {
      subject?: string;
      numQuestions?: number;
      topic?: string | null;
      difficulty?: Difficulty;
      questionType?: QuestionType;
    };
    const durationMinutes = body.durationMinutes || 60;
    const mode = body.mode || "full";
    const prompt = body.prompt || null;

    if (mode === "prompt" && prompt) {
      const extracted = await extractQuizParams(prompt);
      if (extracted.subject) subject = extracted.subject;
      if (extracted.numQuestions) numQuestions = extracted.numQuestions;
      if (extracted.difficulty) difficulty = extracted.difficulty;
      if (extracted.questionType) questionType = extracted.questionType;
      if (extracted.topic) topic = extracted.topic;
    }

    const subj =
      subject && SUBJECTS.includes(subject as Subject) ? (subject as Subject) : (userSubjects[0] as Subject) ?? "Physics";

    const count = Math.min(Math.max(Number(numQuestions) || 25, 10), 50);
    const duration = Math.min(Math.max(Number(durationMinutes) || 60, 15), 180);

    let topicOrPrompt = `${subj} Full WAEC/JAMB Simulation`;
    if (mode === "topic" && topic) {
      topicOrPrompt = `${subj} Topic focus: ${topic}`;
    } else if (mode === "prompt" && prompt) {
      topicOrPrompt = prompt;
    }

    const questions = await generateQuiz(topicOrPrompt, classLevel, subj, count, {
      difficulty,
      questionType
    });

    const questionsWithIds = questions.map((q, i) => ({
      ...q,
      id: `q-${i}-${Date.now()}`
    }));

    const shuffled = [...questionsWithIds].sort(() => Math.random() - 0.5);

    const [sessionRow] = await db
      .insert(quizSessions)
      .values({
        type: "exam",
        userId: session.user.id,
        subject: subj,
        topic: topic || (mode === "full" ? "Full Exam" : "Custom Exam"),
        classLevel,
        questions: shuffled,
        totalQuestions: shuffled.length,
      })
      .returning({ id: quizSessions.id });

    return NextResponse.json({
      sessionId: sessionRow?.id,
      questions: shuffled,
      durationMinutes: duration,
    });
  } catch (e) {
    console.error("Exam start error:", e);
    return NextResponse.json({ error: "Failed to start exam" }, { status: 500 });
  }
}
