import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { questionAttempts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { attemptId, status } = body as {
      attemptId?: number;
      status?: "outstanding" | "in_review" | "resolved";
    };
    if (attemptId == null || !status) {
      return NextResponse.json({ error: "attemptId and status required" }, { status: 400 });
    }

    const [attempt] = await db
      .select()
      .from(questionAttempts)
      .where(eq(questionAttempts.id, attemptId))
      .limit(1);

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    const update: Record<string, unknown> = { status };
    if (status === "resolved") {
      update.resolvedAt = new Date();
    } else if (status === "in_review") {
      update.lastAttemptedAt = new Date();
    }

    await db
      .update(questionAttempts)
      .set(update)
      .where(eq(questionAttempts.id, attemptId));

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Mistake status error:", e);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
