import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { flowSessions, flowStageProgress } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const sessionId = parseInt(id, 10);
  if (isNaN(sessionId)) {
    return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
  }

  try {
    // Verify ownership
    const [existing] = await db
      .select()
      .from(flowSessions)
      .where(eq(flowSessions.id, sessionId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Flow session not found" }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Remove stage progress first (FK cascade also covers this, but be explicit)
    await db
      .delete(flowStageProgress)
      .where(eq(flowStageProgress.sessionId, sessionId));

    await db.delete(flowSessions).where(eq(flowSessions.id, sessionId));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Flow delete error:", e);
    return NextResponse.json({ error: "Failed to delete Flow" }, { status: 500 });
  }
}