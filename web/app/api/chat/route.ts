import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { chatStream } from "@/lib/ai/chat";
import type { ClassLevel } from "@/lib/curriculum";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.GROQ_API_KEY?.trim()) {
    console.error("Chat API: GROQ_API_KEY is not set");
    return NextResponse.json(
      { error: "AI service is not configured. Please set GROQ_API_KEY in the server environment." },
      { status: 503 }
    );
  }
  const classLevel = (session.user as { classLevel?: string }).classLevel as ClassLevel | undefined;
  const subjects = (session.user as { subjects?: string[] }).subjects ?? [];
  if (!classLevel) {
    return NextResponse.json(
      { error: "Please complete onboarding (set class level)" },
      { status: 400 }
    );
  }
  try {
    const body = await request.json();
    const { message, history = [] } = body as { message?: string; history?: { role: "user" | "assistant"; content: string }[] };
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of chatStream(message, classLevel, subjects, history ?? [])) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (e) {
          console.error("Chat stream error:", e);
          const msg = e instanceof Error ? e.message : "Error generating response.";
          controller.enqueue(encoder.encode(`\n[Error: ${msg}]`));
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e) {
    console.error("Chat API error:", e);
    const message = e instanceof Error ? e.message : "Failed to get response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
