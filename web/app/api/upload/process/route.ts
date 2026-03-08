import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { uploads, generatedContent } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PDFParse } from "pdf-parse";
import { getGroqClient } from "@/lib/ai/groq";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { uploadId } = body as { uploadId?: number };
    if (uploadId == null) {
      return NextResponse.json({ error: "uploadId required" }, { status: 400 });
    }
    const [upload] = await db
      .select()
      .from(uploads)
      .where(eq(uploads.id, uploadId))
      .limit(1);
    if (!upload || upload.userId !== session.user.id) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }
    if (upload.type !== "pdf") {
      return NextResponse.json({ error: "Only PDF processing is supported" }, { status: 400 });
    }
    const parser = new PDFParse({ url: upload.url });
    const textResult = await parser.getText();
    await parser.destroy();
    const extractedText = textResult.text?.slice(0, 30000) ?? "";
    await db
      .update(uploads)
      .set({ extractedText })
      .where(eq(uploads.id, uploadId));
    if (!extractedText.trim()) {
      return NextResponse.json({ error: "No text extracted from PDF" }, { status: 400 });
    }
    const classLevel = (session.user as { classLevel?: string }).classLevel ?? "SS1";
    const groq = getGroqClient();
    const summaryResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a tutor for Nigerian secondary students. Summarize the following document content into structured study notes: key concepts, definitions, and bullet points. Use markdown. Keep it concise (about 500-800 words).`,
        },
        { role: "user", content: extractedText.slice(0, 12000) },
      ],
      stream: false,
      max_tokens: 2048,
      temperature: 0.5,
    });
    const summary = summaryResponse.choices[0]?.message?.content ?? "";
    await db.update(uploads).set({ summary }).where(eq(uploads.id, uploadId));
    const [inserted] = await db
      .insert(generatedContent)
      .values({
        type: "notes",
        subject: "General",
        topic: "Uploaded document",
        classLevel: classLevel as "JSS1" | "JSS2" | "JSS3" | "SS1" | "SS2" | "SS3",
        content: { markdown: summary },
        userId: session.user.id,
        uploadId,
      })
      .returning({ id: generatedContent.id });
    return NextResponse.json({ summary, contentId: inserted?.id });
  } catch (e) {
    console.error("Process upload error:", e);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
