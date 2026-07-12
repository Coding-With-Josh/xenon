import { getCurriculumContext } from "@/lib/curriculum";
import type { ClassLevel, Subject, CurriculumTopic } from "@/lib/curriculum";
import type { MicroCheckQuestion } from "@/lib/flows/types";
import {
  buildHookPrompt,
  buildSubsectionNotesPrompt,
  buildMicroCheckPrompt,
  buildExplanationPrompt,
  buildMasteryPrompt,
} from "./prompts";
import type { MasteryContent } from "@/lib/flows/types";
import { getGroqClient } from "./groq";
import { deduplicateQuestions, parseQuestionsFromContent } from "./quiz";
import type { QuizQuestion } from "./quiz";

/**
 * Generate the hook text for a subject+topic.
 */
export async function generateHook(
  subject: Subject,
  topic: string,
  classLevel: ClassLevel
): Promise<string> {
  const curriculumContext = await getCurriculumContext(subject, classLevel, topic);
  const prompt = buildHookPrompt(topic, subject, classLevel, curriculumContext);
  const groq = getGroqClient();
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "system", content: prompt }],
    stream: false,
    max_tokens: 256,
    temperature: 0.7,
  });
  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No hook content from AI");
  return content;
}

/**
 * Generate notes for a single subsection.
 */
export async function generateSubsectionNotes(
  subject: Subject,
  topic: string,
  subsectionName: string,
  classLevel: ClassLevel
): Promise<string> {
  const curriculumContext = await getCurriculumContext(subject, classLevel, topic);
  const prompt = buildSubsectionNotesPrompt(topic, subsectionName, classLevel, curriculumContext);
  const groq = getGroqClient();
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "system", content: prompt }],
    stream: false,
    max_tokens: 2048,
    temperature: 0.7,
  });
  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No notes content from AI");
  return content;
}

/**
 * Generate a micro-check (2-3 questions) for a single subsection.
 * Returns questions tagged with the subsectionId.
 */
export async function generateMicroCheck(
  subject: Subject,
  topic: string,
  subsectionName: string,
  subsectionId: string,
  classLevel: ClassLevel
): Promise<MicroCheckQuestion[]> {
  const curriculumContext = await getCurriculumContext(subject, classLevel, topic);
  const prompt = buildMicroCheckPrompt(topic, subsectionName, classLevel, curriculumContext);
  const groq = getGroqClient();
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "system", content: prompt }],
    stream: false,
    max_tokens: 2048,
    temperature: 0.3,
  });
  const content = response.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("No micro-check content from AI");
  const questions = parseQuestionsFromContent(content) as QuizQuestion[];
  if (questions.length === 0) throw new Error("No valid micro-check questions parsed");
  return questions.map((q, i) => ({
    id: `mc-${subsectionId}-${i}`,
    question: q.question,
    options: q.options ?? [],
    correct: q.correct ?? "A",
    explanation: q.explanation,
    subsectionId,
  }));
}

/**
 * Generate a remediation explanation + fresh micro-check questions for a failed subsection.
 */
export async function generateRemediation(
  subject: Subject,
  topic: string,
  subsectionName: string,
  subsectionId: string,
  classLevel: ClassLevel,
  previousAttempt?: { question: string; userAnswer: string; correctAnswer: string }
): Promise<{ explanation: string; questions: MicroCheckQuestion[] }> {
  const curriculumContext = await getCurriculumContext(subject, classLevel, topic);
  const groq = getGroqClient();

  let explanationPrompt = `A student needs extra help understanding "${subsectionName}" in "${topic}".

Generate a 2-3 sentence explanation of the core concept they missed, using simpler language than a textbook. Focus on the key idea.`;

  if (previousAttempt) {
    explanationPrompt = buildExplanationPrompt(
      previousAttempt.question,
      previousAttempt.correctAnswer,
      previousAttempt.userAnswer,
      subsectionName
    );
  }

  const explanationResponse = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "system", content: explanationPrompt }],
    stream: false,
    max_tokens: 512,
    temperature: 0.7,
  });
  const explanation = explanationResponse.choices[0]?.message?.content ?? "";

  const freshQuestions = await generateMicroCheck(subject, topic, subsectionName, subsectionId, classLevel);

  return { explanation, questions: freshQuestions };
}

/**
 * Precompute the next stage's content in the background.
 * Returns immediately; the caller polls the cache or checks flow_stage_progress.
 */
export async function precomputeNextStage(
  currentStage: string,
  subject: Subject,
  topic: string,
  subsections: { name: string; id: string }[],
  currentSubsectionIndex: number,
  classLevel: ClassLevel
): Promise<void> {
  const groq = getGroqClient();
  const curriculumContext = await getCurriculumContext(subject, classLevel, topic);

  if (currentStage === "hook") {
    // Precompute first subsection notes while student reads hook
    const firstSub = subsections[0];
    if (!firstSub) return;
    const prompt = buildSubsectionNotesPrompt(topic, firstSub.name, classLevel, curriculumContext);
    groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: prompt }],
      stream: false,
      max_tokens: 2048,
      temperature: 0.7,
    }).catch(() => {});
  } else if (currentStage === "notes") {
    // Precompute micro-check for current subsection while student reads notes
    const sub = subsections[currentSubsectionIndex];
    if (!sub) return;
    const prompt = buildMicroCheckPrompt(topic, sub.name, classLevel, curriculumContext);
    groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: prompt }],
      stream: false,
      max_tokens: 2048,
      temperature: 0.3,
    }).catch(() => {});
  } else if (currentStage === "microcheck") {
    // Precompute full quiz generation while student does micro-check
    const { buildDynamicQuizPrompt } = await import("./prompts");
    const prompt = buildDynamicQuizPrompt(
      topic,
      classLevel,
      10,
      curriculumContext,
      "waec-standard",
      "mixed"
    );
    groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: prompt }],
      stream: false,
      max_tokens: 4096,
      temperature: 0.3,
    }).catch(() => {});
  }
}

/**
 * Generate mastery content: exam tips, mnemonics, flashcards, shortcuts.
 */
export async function generateMastery(
  subject: Subject,
  topic: string,
  classLevel: ClassLevel
): Promise<MasteryContent> {
  const curriculumContext = await getCurriculumContext(subject, classLevel, topic);
  const prompt = buildMasteryPrompt(topic, subject, classLevel, curriculumContext);
  const groq = getGroqClient();
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "system", content: prompt }],
    stream: false,
    max_tokens: 4096,
    temperature: 0.5,
  });
  const content = response.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("No mastery content from AI");
  return JSON.parse(content) as MasteryContent;
}
