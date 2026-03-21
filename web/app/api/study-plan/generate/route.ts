import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateStudyPlan } from "@/lib/ai/study-planner";
import { db } from "@/db";
import { studyPlans, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { ClassLevel } from "@/lib/curriculum";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { examType, examDate } = await request.json();

  if (!examType || !examDate) {
    return NextResponse.json({ error: "Missing exam details" }, { status: 400 });
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user || !user.classLevel || !user.subjects) {
      return NextResponse.json({ error: "Complete onboarding first" }, { status: 400 });
    }

    // Save exam details to user
    await db
      .update(users)
      .set({
        examType,
        examDate: new Date(examDate),
      })
      .where(eq(users.id, session.user.id));

    // Generate study plan
    const planDays = await generateStudyPlan(
      user.classLevel as ClassLevel,
      user.subjects as string[],
      examType,
      new Date(examDate),
      "" // curriculumContext - can expand later
    );

    // Save plan days to db
    for (const day of planDays) {
      await db.insert(studyPlans).values({
        userId: session.user.id,
        planDate: new Date(day.date),
        tasks: day.tasks,
      });
    }

    return NextResponse.json({ success: true, plan: planDays });
  } catch (e) {
    console.error("Study plan generate error:", e);
    return NextResponse.json({ error: "Failed to generate study plan" }, { status: 500 });
  }
}
