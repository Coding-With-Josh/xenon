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
    const { subject, numQuestions = 25, durationMinutes = 60 } = body as {
      subject?: string;
      numQuestions?: number;
      durationMinutes?: number;
    };
    const subj =
      subject && SUBJECTS.includes(subject as Subject) ? (subject as Subject) : (userSubjects[0] as Subject) ?? "Physics";
    const count = Math.min(Math.max(Number(numQuestions) || 25, 10), 50);
    const duration = Math.min(Math.max(Number(durationMinutes) || 60, 15), 180);
    const questions = await generateQuiz(`${subj} WAEC/JAMB style`, classLevel, subj, count);
    const questionsWithIds = questions.map((q, i) => ({ id: `q-${i}`, ...q }));
    const shuffled = [...questionsWithIds].sort(() => Math.random() - 0.5);
    const [sessionRow] = await db
      .insert(quizSessions)
      .values({
        type: "exam",
        userId: session.user.id,
        subject: subj,
        topic: null,
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
