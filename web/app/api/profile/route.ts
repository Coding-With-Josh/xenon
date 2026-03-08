import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const CLASS_LEVELS = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"] as const;
const SUBJECTS = ["Physics", "Chemistry", "Biology", "English Language"] as const;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [user] = await db
    .select({ classLevel: users.classLevel, subjects: users.subjects })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({
    classLevel: user.classLevel ?? null,
    subjects: (user.subjects ?? []) as string[],
  });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { classLevel, subjects } = body as {
      classLevel?: string;
      subjects?: string[];
    };
    if (
      classLevel &&
      !CLASS_LEVELS.includes(classLevel as (typeof CLASS_LEVELS)[number])
    ) {
      return NextResponse.json({ error: "Invalid class level" }, { status: 400 });
    }
    if (subjects !== undefined) {
      if (!Array.isArray(subjects)) {
        return NextResponse.json({ error: "Subjects must be an array" }, { status: 400 });
      }
      const invalid = subjects.some((s) => !SUBJECTS.includes(s as (typeof SUBJECTS)[number]));
      if (invalid) {
        return NextResponse.json({ error: "Invalid subject" }, { status: 400 });
      }
    }
    await db
      .update(users)
      .set({
        ...(classLevel && { classLevel: classLevel as (typeof CLASS_LEVELS)[number] }),
        ...(subjects !== undefined && { subjects }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Profile update error:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
