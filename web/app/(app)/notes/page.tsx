import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { generatedContent } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GenerateNoteCard } from "./generate-note-card";

export default async function NotesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const notes = await db
    .select({ id: generatedContent.id, subject: generatedContent.subject, topic: generatedContent.topic, createdAt: generatedContent.createdAt })
    .from(generatedContent)
    .where(and(eq(generatedContent.userId, session.user.id), eq(generatedContent.type, "notes")))
    .orderBy(desc(generatedContent.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-medium">Notes</h1>
        <p className="text-muted-foreground text-sm">Your generated study notes.</p>
      </div>
      <GenerateNoteCard />
      {notes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">
              No notes yet. Generate one above or ask in <Link href="/chat" className="text-primary underline">Xe AI</Link>.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {notes.map((n) => (
            <li key={n.id}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    <Link href={`/notes/${n.id}`} className="hover:underline">
                      {n.topic || n.subject}
                    </Link>
                  </CardTitle>
                  <p className="text-muted-foreground text-xs">{n.subject} · {new Date(n.createdAt).toLocaleDateString()}</p>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
