import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export async function chatCompletion(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  options?: { model?: string; stream?: boolean }
) {
  const model = options?.model ?? DEFAULT_MODEL;
  const stream = options?.stream ?? false;
  return groq.chat.completions.create({
    model,
    messages,
    stream,
    max_tokens: 4096,
    temperature: 0.7,
  });
}

export function getGroqClient() {
  return groq;
}
