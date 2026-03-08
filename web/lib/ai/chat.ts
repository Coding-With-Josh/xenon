import type { ClassLevel } from "@/lib/curriculum";
import { buildChatSystemPrompt } from "./prompts";
import { getGroqClient } from "./groq";

export async function chat(
  userMessage: string,
  classLevel: ClassLevel,
  subjects: string[],
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  const groq = getGroqClient();
  const systemPrompt = buildChatSystemPrompt(classLevel, subjects);
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    stream: false,
    max_tokens: 4096,
    temperature: 0.7,
  });
  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No content in AI response");
  return content;
}

export async function* chatStream(
  userMessage: string,
  classLevel: ClassLevel,
  subjects: string[],
  history: { role: "user" | "assistant"; content: string }[] = []
): AsyncGenerator<string> {
  const groq = getGroqClient();
  const systemPrompt = buildChatSystemPrompt(classLevel, subjects);
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];
  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    stream: true,
    max_tokens: 4096,
    temperature: 0.7,
  });
  for await (const chunk of stream) {
    const text = chunk.choices?.[0]?.delta?.content;
    if (text) yield text;
  }
}
