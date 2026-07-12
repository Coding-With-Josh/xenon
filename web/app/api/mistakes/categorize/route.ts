import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { questionAttempts } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getGroqClient } from "@/lib/ai/groq";

const CATEGORIES = ["concept", "calculation", "formula", "reading", "careless"] as const;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { attemptIds } = body as { attemptIds?: number[] };
    if (!attemptIds || attemptIds.length === 0) {
      return NextResponse.json({ error: "attemptIds required" }, { status: 400 });
    }

    const attempts = await db
      .select()
      .from(questionAttempts)
      .where(inArray(questionAttempts.id, attemptIds));

    const uncategorized = attempts.filter((a) => !a.category);
    if (uncategorized.length === 0) {
      return NextResponse.json({ categorized: 0 });
    }

    const groq = getGroqClient();
    const items = uncategorized.map(
      (a) => `Question: "${a.questionId}"\nStudent answer: "${a.userAnswer}"`
    ).join("\n\n");

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You categorize exam mistakes into one of: ${CATEGORIES.join(", ")}.

- concept: misunderstood the underlying principle or definition
- calculation: arithmetic error, wrong formula application, or unit mistake
- formula: forgot or confused the correct formula
- reading: misread the question, missed a key detail, or misinterpreted what was asked
- careless: simple slip, typo, or avoidable error despite knowing the material

For each question, respond with ONLY the category name, one per line in the same order as the input.`,
        },
        { role: "user", content: items },
      ],
      max_tokens: 256,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) throw new Error("No categorization from AI");

    const categories = content.split("\n").map((c) => c.trim().toLowerCase());
    const now = new Date();

    for (let i = 0; i < Math.min(uncategorized.length, categories.length); i++) {
      const cat = categories[i];
      if (CATEGORIES.includes(cat as any)) {
        await db
          .update(questionAttempts)
          .set({ category: cat as any, lastAttemptedAt: now })
          .where(eq(questionAttempts.id, uncategorized[i].id));
      }
    }

    return NextResponse.json({ categorized: Math.min(uncategorized.length, categories.length) });
  } catch (e) {
    console.error("Categorize error:", e);
    return NextResponse.json({ error: "Failed to categorize" }, { status: 500 });
  }
}
