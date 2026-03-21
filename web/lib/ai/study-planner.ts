import { getGroqClient } from "./groq";
import { buildStudyPlannerPrompt } from "./prompts";
import type { ClassLevel } from "@/lib/curriculum";

export interface StudyPlanDay {
  date: string;
  tasks: {
    subject: string;
    topic: string;
    type: "notes" | "quiz" | "practice";
    completed: boolean;
  }[];
}

export async function generateStudyPlan(
  classLevel: ClassLevel,
  subjects: string[],
  examType: string,
  examDate: Date,
  curriculumContext: string
): Promise<StudyPlanDay[]> {
  const groq = getGroqClient();
  const prompt = buildStudyPlannerPrompt(
    classLevel,
    subjects,
    examType,
    examDate.toDateString(),
    curriculumContext
  );

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: "Generate my 7-day study plan." },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("No content in AI response");

  try {
    const parsed = JSON.parse(content);
    // If AI returns an object with a field (like "plan" or "days"), extract the array
    const daysArr = Array.isArray(parsed) ? parsed : Object.values(parsed).find(Array.isArray) ?? [];
    
    return daysArr.map((day: any) => ({
      date: day.date,
      tasks: day.tasks.map((t: any) => ({
        ...t,
        completed: false
      }))
    }));
  } catch (e) {
    console.error("Failed to parse study plan:", e);
    throw new Error("Invalid study plan format");
  }
}
