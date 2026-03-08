import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { chatSessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const list = await db
    .select({ id: chatSessions.id, title: chatSessions.title, updatedAt: chatSessions.updatedAt })
    .from(chatSessions)
    .where(eq(chatSessions.userId, session.user.id))
    .orderBy(desc(chatSessions.updatedAt));
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.slice(0, 200) : "New chat";
  const [created] = await db
    .insert(chatSessions)
    .values({ userId: session.user.id, title })
    .returning({ id: chatSessions.id, title: chatSessions.title });
  if (!created) return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  return NextResponse.json(created);
}
