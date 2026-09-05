import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { flowSessions, flowStageProgress, curriculum } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { FlowShell } from "@/components/flows/flow-shell";
import { FlowSidePanel } from "@/components/flows/flow-side-panel";
import { dedupe } from "@/lib/utils";

export default async function FlowSessionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { slug } = await params;

  const [flowSession] = await db
    .select()
    .from(flowSessions)
    .where(eq(flowSessions.slug, slug))
    .limit(1);

  if (!flowSession || flowSession.userId !== session.user.id) notFound();

  const sessionId = flowSession.id;

  const rawProgress = await db
    .select()
    .from(flowStageProgress)
    .where(eq(flowStageProgress.sessionId, sessionId))
    .orderBy(flowStageProgress.createdAt);

  const progress = rawProgress.map((p) => ({
    ...p,
    data: (p.data ?? {}) as Record<string, unknown>,
  }));

  const curriculumRows = await db
    .select()
    .from(curriculum)
    .where(
      and(eq(curriculum.subject, flowSession.subject as any), eq(curriculum.topic, flowSession.topic))
    );
  const subtopics = dedupe(curriculumRows.flatMap((r) => (r.subtopics as string[]) ?? []));
  const subsections = subtopics.map((name, i) => ({
    name,
    id: `${flowSession.subject}-${flowSession.topic}-${i}`.toLowerCase().replace(/\s+/g, "-"),
  }));

  return (
    <div className="flex gap-8 h-full py-4">
      <div className="flex-1 min-w-0">
        {/* pb-24 on mobile reserves space for the fixed bottom status band
            (caption + action button) so content never scrolls underneath it. */}
        <FlowShell
          session={flowSession}
          progress={progress}
          subsections={subsections}
          className="pb-24 lg:pb-0"
        />
      </div>
      <FlowSidePanel
        session={flowSession}
        progress={progress}
        subsections={subsections}
      />
    </div>
  );
}
