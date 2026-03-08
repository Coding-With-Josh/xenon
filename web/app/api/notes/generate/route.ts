import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateNotes } from "@/lib/ai/notes";
import { db } from "@/db";
import { generatedContent } from "@/db/schema";
import type { ClassLevel } from "@/lib/curriculum";
import type { Subject } from "@/lib/curriculum";

const SUBJECTS: Subject[] = ["Physics", "Chemistry", "Biology", "English Language"];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const classLevel = (session.user as { classLevel?: string }).classLevel as ClassLevel | undefined;
  const subjects = (session.user as { subjects?: string[] }).subjects ?? [];
  if (!classLevel) {
    return NextResponse.json(
      { error: "Please complete onboarding (set class level)" },
      { status: 400 }
    );
  }
  try {
    const body = await request.json();
    const { prompt, subject, topic, fullNote } = body as {
      prompt?: string;
      subject?: string;
      topic?: string;
      fullNote?: boolean;
    };
    const wantFull = Boolean(fullNote);
    const promptText = typeof prompt === "string" && prompt.trim() ? prompt.trim() : (topic && `Notes on ${topic}`) || "General revision notes";
    const subj = (subject && SUBJECTS.includes(subject as Subject) ? subject : subjects[0] ?? "Physics") as Subject;
    const content = await generateNotes(promptText, classLevel, subj, topic, wantFull);
    const [inserted] = await db
      .insert(generatedContent)
      .values({
        type: "notes",
        subject: subj,
        topic: (topic && String(topic).trim()) || promptText.slice(0, 200),
        classLevel,
        content: { markdown: content },
        userId: session.user.id,
      })
      .returning({ id: generatedContent.id });
    return NextResponse.json({ content, id: inserted?.id });
  } catch (e) {
    console.error("Notes generate error:", e);
    return NextResponse.json({ error: "Failed to generate notes" }, { status: 500 });
  }
}
