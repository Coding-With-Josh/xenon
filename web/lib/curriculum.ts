import { db } from "@/db";
import { curriculum } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export type ClassLevel =
  | "JSS1"
  | "JSS2"
  | "JSS3"
  | "SS1"
  | "SS2"
  | "SS3";

export type Subject = "Physics" | "Chemistry" | "Biology" | "English Language";

export interface CurriculumTopic {
  subject: string;
  topic: string;
  subtopics: string[];
  classLevels: string[];
}

/**
 * Get curriculum context for a given subject and class level (and optional topic).
 * Used to inject structured context into AI prompts.
 */
export async function getCurriculumContext(
  subject: Subject,
  classLevel: ClassLevel,
  topic?: string
): Promise<CurriculumTopic[]> {
  const rows = await db
    .select()
    .from(curriculum)
    .where(topic ? and(eq(curriculum.subject, subject), eq(curriculum.topic, topic)) : eq(curriculum.subject, subject));
  return rows
    .filter((r) => {
      const levels = (r.classLevels as string[]) ?? [];
      return levels.includes(classLevel);
    })
    .map((r) => ({
      subject: r.subject,
      topic: r.topic,
      subtopics: (r.subtopics as string[]) ?? [],
      classLevels: (r.classLevels as string[]) ?? [],
    }));
}

/**
 * Format curriculum context as a string for inclusion in prompts.
 */
export function formatCurriculumForPrompt(topics: CurriculumTopic[]): string {
  if (topics.length === 0) return "";
  return topics
    .map(
      (t) =>
        `- ${t.topic}${t.subtopics.length ? ` (subtopics: ${t.subtopics.join(", ")})` : ""}`
    )
    .join("\n");
}
