import { getCurriculumContext } from "@/lib/curriculum";
import type { ClassLevel } from "@/lib/curriculum";
import type { Subject } from "@/lib/curriculum";
import { buildDynamicQuizPrompt } from "./prompts";
import { getGroqClient } from "./groq";

const BATCH_SIZE = 8;

export type QuestionType = "objective" | "theory" | "mixed";
export type Difficulty = "easy" | "medium" | "hard" | "waec-standard";

export interface QuizQuestion {
  id?: string;
  question: string;
  type: "objective" | "theory";
  options?: string[];
  correct?: string;
  explanation: string;
  subsectionId?: string;
  markingScheme?: {
    points: string[];
    totalMarks: number;
  };
}

const IGNORE_WORDS = new Set([
  "the","a","an","is","are","was","were","be","been","being",
  "have","has","had","do","does","did","will","would","could",
  "should","may","might","shall","can","to","of","in","for",
  "on","with","at","by","from","as","into","through","during",
  "before","after","above","below","between","out","off","over",
  "under","again","further","then","once","here","there","when",
  "where","why","how","all","each","every","both","few","more",
  "most","other","some","such","no","nor","not","only","own",
  "same","so","than","too","very","just","because","about",
  "which","what","who","whom","this","that","these","those",
  "it","its","it's","i","you","your","we","our","they","them",
  "their","he","she","his","her","him","one","two","three",
  "first","second","also","if","or","but","and","are","which",
]);

function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !IGNORE_WORDS.has(w));
}

function similarity(a: string, b: string): number {
  const wa = normalize(a);
  const wb = normalize(b);
  if (wa.length === 0 || wb.length === 0) return 0;
  const setA = new Set(wa);
  const setB = new Set(wb);
  let intersection = 0;
  for (const w of setA) if (setB.has(w)) intersection++;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

export function deduplicateQuestions(
  questions: QuizQuestion[],
  threshold = 0.65
): QuizQuestion[] {
  const result: QuizQuestion[] = [];
  for (const q of questions) {
    let isDuplicate = false;
    for (const existing of result) {
      if (similarity(q.question, existing.question) >= threshold) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) result.push(q);
  }
  return result;
}

export function parseQuestionsFromContent(content: string): QuizQuestion[] {
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
    const type = (row.type === "theory" ? "theory" : "objective") as "theory" | "objective";

    if (type === "objective") {
      let options = Array.isArray(row.options) ? row.options.map(String) : [];
      if (options.length === 0 && Array.isArray(row.choices)) options = row.choices.map(String);
      const correct = String(row.correct ?? row.answer ?? "A").toUpperCase().slice(0, 1);
      const explanation = String(row.explanation ?? row.explanationText ?? "").trim();
      if (!question || options.length < 2) continue;
      questions.push({ question, type, options, correct, explanation });
    } else {
      const explanation = String(row.explanation ?? row.idealAnswer ?? "").trim();
      const markingScheme = row.markingScheme as { points: string[]; totalMarks: number } | undefined;
      if (!question) continue;
      questions.push({
        question,
        type,
        explanation,
        markingScheme: markingScheme ?? { points: [], totalMarks: 5 }
      });
    }
  }
  return questions;
}

export async function extractQuizParams(prompt: string): Promise<{
  subject?: Subject;
  topic?: string;
  numQuestions?: number;
  difficulty?: Difficulty;
  questionType?: QuestionType;
}> {
  const groq = getGroqClient();
  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: `Extract quiz parameters from the user prompt. 
        Subjects: Physics, Chemistry, Biology, English Language.
        Difficulties: easy, medium, hard, waec-standard.
        Types: objective, theory, mixed.
        Return ONLY a JSON object. Example: {"subject":"Chemistry","topic":"Electrolysis","numQuestions":30,"difficulty":"hard","questionType":"objective"}`,
      },
      { role: "user", content: prompt },
    ],
    temperature: 0,
    response_format: { type: "json_object" },
  });
  const content = response.choices[0]?.message?.content?.trim();
  if (!content) return {};
  return JSON.parse(content);
}

export async function generateQuiz(
  topicOrPrompt: string,
  classLevel: ClassLevel,
  subject: Subject,
  numQuestions: number = 5,
  options?: {
    difficulty?: Difficulty;
    questionType?: QuestionType;
    existingTopics?: string[];
  }
): Promise<QuizQuestion[]> {
  const curriculumContext = await getCurriculumContext(subject, classLevel);
  const groq = getGroqClient();

  async function run(
    requestedCount: number,
    existingTopics?: string[]
  ): Promise<QuizQuestion[]> {
    const systemPrompt = buildDynamicQuizPrompt(
      topicOrPrompt,
      classLevel,
      requestedCount,
      curriculumContext,
      options?.difficulty ?? "waec-standard",
      options?.questionType ?? "objective",
      existingTopics
    );

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate ${requestedCount} ${options?.questionType || 'objective'} questions about: ${topicOrPrompt}. Do NOT repeat any of the questions already listed. Reply with ONLY a JSON array.` },
      ],
      stream: false,
      max_tokens: 4096,
      temperature: 0.3,
    });
    const content = response.choices[0]?.message?.content?.trim();
    if (!content) throw new Error("No content in AI response");
    const questions = deduplicateQuestions(parseQuestionsFromContent(content));
    if (questions.length === 0) throw new Error("No valid questions in response");
    return questions;
  }

  const priorTopics = options?.existingTopics ?? [];

  if (numQuestions <= BATCH_SIZE) {
    try {
      return deduplicateQuestions(await run(numQuestions, priorTopics));
    } catch (firstError) {
      console.warn("Quiz generation first attempt failed, retrying once:", firstError);
      return deduplicateQuestions(await run(numQuestions, priorTopics));
    }
  }

  const all: QuizQuestion[] = [];
  let remaining = numQuestions;
  let attempt = 0;
  const maxBatches = Math.ceil(numQuestions / BATCH_SIZE) + 2;

  while (all.length < numQuestions && attempt < maxBatches) {
    const batchSize = Math.min(BATCH_SIZE, remaining);
    try {
      const existingTopics = [...priorTopics, ...all.map((q) => q.question.slice(0, 80))];
      const batch = await run(batchSize, existingTopics);
      const fresh = deduplicateQuestions([...all, ...batch]).slice(all.length);
      all.push(...fresh);
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
