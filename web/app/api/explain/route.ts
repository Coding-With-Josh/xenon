import { NextResponse } from "next/server";
import { getGroqClient } from "@/lib/ai/groq";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, subject, topic } = body as {
      text?: string;
      subject?: string;
      topic?: string;
    };

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert tutor for Nigerian secondary school science students preparing for WAEC and JAMB.

The student has selected text from their study notes and wants an explanation. 

Given the selected text and context, provide:
1. A clear, simple explanation of what this means
2. Why it's important for the exam
3. A quick tip to remember it

Keep it concise — 3-4 sentences max. Be encouraging and clear.

${subject ? `Subject: ${subject}` : ""}
${topic ? `Topic: ${topic}` : ""}`,
        },
        {
          role: "user",
          content: `Explain this from my notes: "${text}"`,
        },
      ],
      stream: false,
      max_tokens: 512,
      temperature: 0.5,
    });

    const explanation = response.choices[0]?.message?.content;
    if (!explanation) throw new Error("No explanation from AI");

    return NextResponse.json({ explanation });
  } catch (e) {
    console.error("Explain error:", e);
    return NextResponse.json({ error: "Failed to generate explanation" }, { status: 500 });
  }
}
