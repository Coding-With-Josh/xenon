import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAnalytics } from "@/lib/analytics";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      classLevel: users.classLevel,
      subjects: users.subjects,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  try {
    const analytics = await getAnalytics(userId);
    return NextResponse.json({ user, analytics });
  } catch (e) {
    console.error("Admin user progress error:", e);
    return NextResponse.json({ error: "Failed to load progress" }, { status: 500 });
  }
}
