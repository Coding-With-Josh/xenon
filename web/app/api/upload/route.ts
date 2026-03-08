import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Use PDF or image." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }
    const type = file.type === "application/pdf" ? "pdf" : "image";
    const blob = await put(`uploads/${session.user.id}/${Date.now()}-${file.name}`, file, {
      access: "public",
    });
    const [row] = await db
      .insert(uploads)
      .values({
        userId: session.user.id,
        type,
        url: blob.url,
      })
      .returning({ id: uploads.id, url: uploads.url });
    return NextResponse.json({ id: row?.id, url: row?.url });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const list = await db
    .select({ id: uploads.id, type: uploads.type, url: uploads.url, createdAt: uploads.createdAt })
    .from(uploads)
    .where(eq(uploads.userId, session.user.id))
    .orderBy(desc(uploads.createdAt));
  return NextResponse.json(list);
}
