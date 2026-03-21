import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGroqClient } from "@/lib/ai/groq";
import { buildSimplificationPrompt } from "@/lib/ai/prompts";
import type { ClassLevel } from "@/lib/curriculum";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content } = await request.json();
  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const classLevel = (session.user as { classLevel?: string }).classLevel as ClassLevel | undefined;
  if (!classLevel) {
    return NextResponse.json({ error: "Complete onboarding first" }, { status: 400 });
  }

  try {
    const groq = getGroqClient();
    const prompt = buildSimplificationPrompt(content, classLevel);

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: `Simplify this for me: ${content.slice(0, 1000)}` },
      ],
      temperature: 0.3,
    });

    const result = response.choices[0]?.message?.content?.trim();
    return NextResponse.json({ result });
  } catch (e) {
    console.error("Simplification error:", e);
    return NextResponse.json({ error: "Failed to simplify content" }, { status: 500 });
  }
}
