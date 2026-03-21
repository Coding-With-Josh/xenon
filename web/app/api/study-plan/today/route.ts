import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { studyPlans } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  try {
    const plan = await db.query.studyPlans.findFirst({
      where: and(
        eq(studyPlans.userId, session.user.id),
        gte(studyPlans.planDate, today),
        lte(studyPlans.planDate, tomorrow)
      ),
    });

    return NextResponse.json(plan ?? { tasks: [] });
  } catch (e) {
    console.error("Fetch study plan error:", e);
    return NextResponse.json({ error: "Failed to fetch study plan" }, { status: 500 });
  }
}
