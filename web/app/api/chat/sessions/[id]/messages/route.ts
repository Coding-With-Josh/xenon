import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { chatSessions, chatMessages } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const sessionId = parseInt(id, 10);
  if (Number.isNaN(sessionId)) {
    return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
  }
  const [chatSession] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, sessionId))
    .limit(1);
  if (!chatSession || chatSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await request.json().catch(() => ({}));
  const messages = Array.isArray(body.messages)
    ? body.messages
    : body.role != null && body.content != null
      ? [{ role: body.role, content: body.content }]
      : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "No messages" }, { status: 400 });
  }
  for (const m of messages) {
    const role = m?.role === "user" || m?.role === "assistant" ? m.role : "user";
    const content = typeof m?.content === "string" ? m.content : String(m?.content ?? "");
    await db.insert(chatMessages).values({
      sessionId,
      role,
      content,
    });
  }
  await db
    .update(chatSessions)
    .set({ updatedAt: new Date() })
    .where(eq(chatSessions.id, sessionId));
  return NextResponse.json({ ok: true });
}
