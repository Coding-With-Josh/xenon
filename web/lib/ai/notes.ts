import { getCurriculumContext } from "@/lib/curriculum";
import type { ClassLevel } from "@/lib/curriculum";
import type { Subject } from "@/lib/curriculum";
import { buildNotesPrompt, buildFullNotesPrompt } from "./prompts";
import { getGroqClient } from "./groq";

export async function generateNotes(
  studentPrompt: string,
  classLevel: ClassLevel,
  subject: Subject,
  topic?: string,
  fullNote = false
): Promise<string> {
  const curriculumContext = await getCurriculumContext(subject, classLevel, topic);
  const systemPrompt = fullNote
    ? buildFullNotesPrompt(studentPrompt, classLevel, curriculumContext)
    : buildNotesPrompt(studentPrompt, classLevel, curriculumContext);
  const groq = getGroqClient();
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: fullNote ? `Generate full study notes on: ${studentPrompt}` : studentPrompt },
    ],
    stream: false,
    max_tokens: fullNote ? 8192 : 4096,
    temperature: 0.7,
  });
  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No content in AI response");
  return content;
}
