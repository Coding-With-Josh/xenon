import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGroqClient } from "@/lib/ai/groq";
import { buildTheoryAnswerCheckerPrompt } from "@/lib/ai/prompts";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { question, idealAnswer, studentAnswer, markingScheme } = await request.json();

    if (!question || !idealAnswer || !studentAnswer || !markingScheme) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const groq = getGroqClient();
    const systemPrompt = buildTheoryAnswerCheckerPrompt(
      question,
      idealAnswer,
      studentAnswer,
      markingScheme
    );

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Mark this answer and provide feedback as a JSON object." },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) throw new Error("No content in AI response");

    const result = JSON.parse(content);

    return NextResponse.json(result);
  } catch (e) {
    console.error("Theory check error:", e);
    return NextResponse.json({ error: "Failed to check answer" }, { status: 500 });
  }
}
