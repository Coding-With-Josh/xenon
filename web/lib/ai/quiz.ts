import { getCurriculumContext } from "@/lib/curriculum";
import type { ClassLevel } from "@/lib/curriculum";
import type { Subject } from "@/lib/curriculum";
import { buildQuizPrompt } from "./prompts";
import { getGroqClient } from "./groq";

const BATCH_SIZE = 8;

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: string;
  explanation: string;
}

function parseQuestionsFromContent(content: string): QuizQuestion[] {
  let jsonStr = content;
  const codeBlock = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) jsonStr = codeBlock[1].trim();
  else {
    const firstBracket = jsonStr.indexOf("[");
    const lastBracket = jsonStr.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      jsonStr = jsonStr.slice(firstBracket, lastBracket + 1);
    }
  }
  const parsed = JSON.parse(jsonStr) as unknown;
  const arr = Array.isArray(parsed) ? parsed : [parsed];
  const questions: QuizQuestion[] = [];
  for (const q of arr) {
    if (!q || typeof q !== "object") continue;
    const row = q as Record<string, unknown>;
    const question = String(row.question ?? row.q ?? "").trim();
    let options = Array.isArray(row.options) ? row.options.map(String) : [];
    if (options.length === 0 && Array.isArray(row.choices)) options = row.choices.map(String);
    const correct = String(row.correct ?? row.answer ?? "A").toUpperCase().slice(0, 1);
    const explanation = String(row.explanation ?? row.explanationText ?? "").trim();
    if (!question || options.length < 2) continue;
    questions.push({ question, options, correct, explanation });
  }
  return questions;
}

export async function generateQuiz(
  topicOrPrompt: string,
  classLevel: ClassLevel,
  subject: Subject,
  numQuestions: number = 5
): Promise<QuizQuestion[]> {
  const curriculumContext = await getCurriculumContext(subject, classLevel);
  const groq = getGroqClient();

  async function run(requestedCount: number): Promise<QuizQuestion[]> {
    const systemPrompt = buildQuizPrompt(
      topicOrPrompt,
      classLevel,
      requestedCount,
      curriculumContext
    );
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate ${requestedCount} questions about: ${topicOrPrompt}. Reply with ONLY a JSON array, no other text.` },
      ],
      stream: false,
      max_tokens: 4096,
      temperature: 0.3,
    });
    const content = response.choices[0]?.message?.content?.trim();
    if (!content) throw new Error("No content in AI response");
    const questions = parseQuestionsFromContent(content);
    if (questions.length === 0) throw new Error("No valid questions in response");
    return questions;
  }

  if (numQuestions <= BATCH_SIZE) {
    try {
      return await run(numQuestions);
    } catch (firstError) {
      console.warn("Quiz generation first attempt failed, retrying once:", firstError);
      return await run(numQuestions);
    }
  }

  const all: QuizQuestion[] = [];
  let remaining = numQuestions;
  let attempt = 0;
  const maxBatches = Math.ceil(numQuestions / BATCH_SIZE) + 2;

  while (all.length < numQuestions && attempt < maxBatches) {
    const batchSize = Math.min(BATCH_SIZE, remaining);
    try {
      const batch = await run(batchSize);
      all.push(...batch);
      remaining = numQuestions - all.length;
    } catch (e) {
      console.warn(`Quiz batch ${attempt + 1} failed:`, e);
      if (all.length >= Math.ceil(numQuestions / 2)) break;
    }
    attempt++;
  }

  if (all.length === 0) throw new Error("AI did not return valid quiz JSON");
  return all.slice(0, numQuestions);
}
