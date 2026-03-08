import { buildExplanationPrompt } from "./prompts";
import { getGroqClient } from "./groq";

export async function explainWrongAnswer(
  question: string,
  correctAnswer: string,
  studentAnswer: string
): Promise<string> {
  const groq = getGroqClient();
  const prompt = buildExplanationPrompt(question, correctAnswer, studentAnswer);
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    stream: false,
    max_tokens: 512,
    temperature: 0.5,
  });
  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No content in AI response");
  return content;
}
