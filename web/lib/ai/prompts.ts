import type { ClassLevel } from "@/lib/curriculum";
import { formatCurriculumForPrompt } from "@/lib/curriculum";
import type { CurriculumTopic } from "@/lib/curriculum";

const EXAM_CONTEXT =
  "Nigerian secondary education, WAEC and JAMB exam style. Use clear, concise language suitable for exam preparation.";

/**
 * Build a structured prompt for notes generation from a student's raw prompt.
 */
export function buildNotesPrompt(
  studentPrompt: string,
  classLevel: ClassLevel,
  curriculumContext: CurriculumTopic[]
): string {
  const curriculumText = formatCurriculumForPrompt(curriculumContext);
  return `You are an expert tutor for Nigerian secondary school science students preparing for WAEC and JAMB.

Context: ${EXAM_CONTEXT}
Class level: ${classLevel}

${curriculumText ? `Relevant curriculum:\n${curriculumText}\n` : ""}

Student request: ${studentPrompt}

Generate structured study notes that include:
1. Definition and key concepts
2. Step-by-step explanations where applicable
3. Key terms and formulas
4. Worked examples where relevant
5. Exam tips and common pitfalls
6. A short summary at the end

Format the response in clear sections with headings. Use markdown. For formulas and calculations use LaTeX: $...$ for inline (e.g. $c = Q/(m \\Delta T)$) and $$...$$ for display equations.`;
}

/**
 * Build prompt for a "full" comprehensive note (longer, more detail).
 */
export function buildFullNotesPrompt(
  topicOrTitle: string,
  classLevel: ClassLevel,
  curriculumContext: CurriculumTopic[]
): string {
  const curriculumText = formatCurriculumForPrompt(curriculumContext);
  return `You are an expert tutor for Nigerian secondary school science students preparing for WAEC and JAMB.

Context: ${EXAM_CONTEXT}
Class level: ${classLevel}

${curriculumText ? `Relevant curriculum:\n${curriculumText}\n` : ""}

Generate a full, comprehensive set of study notes on: ${topicOrTitle}

Include:
1. Clear introduction and definition
2. Key concepts with detailed explanations
3. Step-by-step explanations and worked examples where applicable
4. Key terms, formulas, and equations
5. Multiple examples and applications
6. Exam tips, common pitfalls, and past question pointers
7. Summary and quick revision checklist at the end

Be thorough but well-structured. Use markdown with headings (###, ####), bullet lists, and bold for key terms. For formulas and calculations use LaTeX: $...$ for inline math and $$...$$ for display equations so they render correctly. Aim for a complete study note suitable for exam revision.`;
}

/**
 * Build a structured prompt for quiz/question generation.
 */
export function buildQuizPrompt(
  topicOrPrompt: string,
  classLevel: ClassLevel,
  numQuestions: number,
  curriculumContext: CurriculumTopic[]
): string {
  const curriculumText = formatCurriculumForPrompt(curriculumContext);
  return `You are an expert tutor for Nigerian secondary school science students preparing for WAEC and JAMB.

Context: ${EXAM_CONTEXT}
Class level: ${classLevel}
Number of questions: ${numQuestions}

${curriculumText ? `Relevant curriculum:\n${curriculumText}\n` : ""}

Topic or request: ${topicOrPrompt}

Generate exactly ${numQuestions} WAEC/JAMB-style multiple choice questions. For each question provide:
1. "question": The question text
2. "options": Array of 4 options (A, B, C, D)
3. "correct": The letter of the correct answer (A, B, C, or D)
4. "explanation": A brief explanation of the correct answer

Output ONLY a valid JSON array. No markdown code fences, no text before or after the array. Example:
[{"question":"...","options":["A...","B...","C...","D..."],"correct":"A","explanation":"..."}]`;
}

/**
 * Build system prompt for the Xe AI chatbot.
 */
export function buildChatSystemPrompt(classLevel: ClassLevel, subjects: string[]): string {
  return `You are Xe, the AI assistant for Xenon - an exam preparation platform for Nigerian secondary school students. Your role is to help students study for WAEC and JAMB.

Context: ${EXAM_CONTEXT}
Student's class level: ${classLevel}
Student's subjects: ${subjects.join(", ") || "Not set"}

You can:
- Explain concepts at the appropriate depth for their class level
- Generate study notes when asked (structure with definitions, key points, examples, exam tips)
- Generate practice questions (WAEC/JAMB-style multiple choice) when asked
- Summarize topics and suggest what to focus on

Be concise, clear, and exam-focused. When generating notes or questions, use markdown and structure your response clearly. For formulas and calculations use LaTeX: inline math in $...$ (e.g. $c = Q/(m \\Delta T)$) and display equations on their own line in $$...$$ (e.g. $$E = mc^2$$). Use \\Delta for change, \\frac{a}{b} for fractions, and standard LaTeX for symbols so calculations render properly.`;
}

/**
 * Build prompt for explaining a wrong answer (mistake review).
 */
export function buildExplanationPrompt(
  question: string,
  correctAnswer: string,
  studentAnswer: string
): string {
  return `A student answered a practice question incorrectly. Generate a brief, helpful explanation.

Question: ${question}
Correct answer: ${correctAnswer}
Student's answer: ${studentAnswer}

In 2-4 sentences: explain why the correct answer is right, what misconception the student might have had, and suggest a key point to remember. Be encouraging.`;
}
