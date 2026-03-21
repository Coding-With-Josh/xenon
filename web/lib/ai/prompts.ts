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
 * Build a dynamic prompt for quiz/question generation with type and difficulty.
 */
export function buildDynamicQuizPrompt(
  topicOrPrompt: string,
  classLevel: ClassLevel,
  numQuestions: number,
  curriculumContext: CurriculumTopic[],
  difficulty: string,
  type: string
): string {
  const curriculumText = formatCurriculumForPrompt(curriculumContext);
  const isTheory = type === "theory" || type === "mixed";

  return `You are an expert tutor for Nigerian secondary school science students preparing for WAEC and JAMB.

Context: ${EXAM_CONTEXT}
Class level: ${classLevel}
Difficulty: ${difficulty}
Target Type: ${type}
Number of questions: ${numQuestions}

${curriculumText ? `Relevant curriculum:\n${curriculumText}\n` : ""}

Topic or request: ${topicOrPrompt}

Generate exactly ${numQuestions} WAEC/JAMB-style questions. 
${type === 'mixed' ? 'Mix objective (multiple choice) and theory questions.' : `Generate ONLY ${type} questions.`}

For each question, follow this JSON structure:
- If objective:
  {
    "type": "objective",
    "question": "...",
    "options": ["A...", "B...", "C...", "D..."],
    "correct": "A",
    "explanation": "..."
  }
- If theory:
  {
    "type": "theory",
    "question": "...",
    "explanation": "This is the ideal model answer for the student to compare against.",
    "markingScheme": {
      "points": ["Key point 1 (2 marks)", "Key point 2 (2 marks)", "Key point 3 (1 mark)"],
      "totalMarks": 5
    }
  }

Output ONLY a valid JSON array. No text before or after.`;
}

/**
 * Build prompt for AI Theory Answer Checker.
 */
export function buildTheoryAnswerCheckerPrompt(
  question: string,
  idealAnswer: string,
  studentAnswer: string,
  markingScheme: { points: string[]; totalMarks: number }
): string {
  return `You are an expert WAEC examiner marking a theory question. 

Question: ${question}
Ideal Answer: ${idealAnswer}
Student's Answer: ${studentAnswer}
Marking Scheme Points: ${markingScheme.points.join(", ")}
Total Possible Marks: ${markingScheme.totalMarks}

Evaluate the student's answer based on:
1. Concept Coverage: Did they mention the key points in the marking scheme?
2. Accuracy: Are their statements scientifically correct?
3. Completeness: Is the explanation thorough enough for the marks?

Provide:
1. "score": Numerical score out of ${markingScheme.totalMarks}
2. "feedback": A list of what they did well and what they missed.
3. "breakdown": How the marks were awarded.
4. "improvedAnswer": A version of their answer that would get full marks, maintaining their style where possible.

Output ONLY a valid JSON object.`;
}

/**
 * Build prompt for AI Study Planner.
 */
export function buildStudyPlannerPrompt(
  classLevel: ClassLevel,
  subjects: string[],
  examType: string,
  examDate: string,
  curriculumContext: string
): string {
  return `You are an expert AI Study Planner for Xenon. 
Your goal is to create a 7-day daily study plan for a student preparing for ${examType}.

Context:
Class level: ${classLevel}
Subjects: ${subjects.join(", ")}
Exam date: ${examDate}
${curriculumContext ? `Relevant Curriculum Topics: ${curriculumContext}` : ""}

Today's date: ${new Date().toLocaleDateString()}

Generate a 7-day study plan. For each day, provide 2-3 specific tasks. 
Each task must have:
- "subject": One of the student's subjects.
- "topic": A specific topic from the curriculum.
- "type": One of "notes" (learning), "quiz" (testing), or "practice" (problem solving).

Output ONLY a JSON array of 7 days. Example:
[
  {
    "date": "2026-03-21",
    "tasks": [
      {"subject": "Chemistry", "topic": "Acids & Bases", "type": "notes"},
      {"subject": "Physics", "topic": "Motion", "type": "quiz"}
    ]
  },
  ...
]`;
}

/**
 * Build prompt for "Break This Down For Me" (Simplification).
 */
export function buildSimplificationPrompt(
  content: string,
  classLevel: ClassLevel
): string {
  return `You are an expert tutor specializing in simplifying complex academic concepts for Nigerian secondary school students.

Class level: ${classLevel}

The student has provided the following "hard" content:
---
${content}
---

Your task is to break this down into:
1. A simple, "ELI5" (Explain Like I'm 5) explanation.
2. Key bullet points (no more than 5).
3. A memory trick or mnemonic to remember the core concept.

Use clear, relatable language. Avoid unnecessary jargon. If you must use a technical term, explain it simply.

Format with markdown.`;
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
