import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { curriculum } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type { Subject } from "@/lib/curriculum";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject");
  const classLevel = searchParams.get("classLevel");
  if (!subject || !classLevel) {
    return NextResponse.json({ error: "subject and classLevel required" }, { status: 400 });
  }
  try {
    const rows = await db
      .select()
      .from(curriculum)
      .where(eq(curriculum.subject, subject as Subject));
    const filtered = rows.filter((r) => {
      const levels = (r.classLevels as string[]) ?? [];
      return levels.includes(classLevel);
    });
    // Dedupe by topic — the curriculum table may contain legacy duplicate rows.
    const seen = new Set<string>();
    const topics = filtered
      .filter((r) => {
        if (seen.has(r.topic)) return false;
        seen.add(r.topic);
        return true;
      })
      .map((r) => ({
        topic: r.topic,
        subtopics: (r.subtopics as string[]) ?? [],
      }));
    return NextResponse.json({ topics });
  } catch (e) {
    console.error("Curriculum topics error:", e);
    return NextResponse.json({ error: "Failed to fetch topics" }, { status: 500 });
  }
}