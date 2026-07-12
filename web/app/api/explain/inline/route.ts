import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGroqClient } from "@/lib/ai/groq";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { selectedText, subsectionContext } = body as {
      selectedText?: string;
      subsectionContext?: string;
    };
    if (!selectedText) {
      return NextResponse.json({ error: "selectedText required" }, { status: 400 });
    }

    const groq = getGroqClient();
    const contextBlock = subsectionContext
      ? `\nContext: This is from the "${subsectionContext}" section of the topic.\n`
      : "";

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a helpful tutor for Nigerian secondary school students preparing for WAEC and JAMB.${contextBlock}
The student selected a line from their study notes. Explain it in simple terms, as if you were sitting next to them.
Keep your response to 2-4 sentences. Be encouraging.`,
        },
        {
          role: "user",
          content: `Please explain this: "${selectedText}"`,
        },
      ],
      stream: false,
      max_tokens: 512,
      temperature: 0.5,
    });

    const explanation = response.choices[0]?.message?.content;
    if (!explanation) {
      return NextResponse.json({ error: "No explanation generated" }, { status: 500 });
    }

    return NextResponse.json({ explanation });
  } catch (e) {
    console.error("Inline explain error:", e);
    return NextResponse.json({ error: "Failed to generate explanation" }, { status: 500 });
  }
}
