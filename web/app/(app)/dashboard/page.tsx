import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard-data";
import { GreetingHeader } from "./greeting-header";
import { HeroCard } from "./hero-card";
import { MetricsPanel } from "./metrics-panel";
import { ToolsGrid } from "./tools-grid";
import { ActivityFeed } from "./activity-feed";
import { RecentSessionsTable } from "./recent-sessions-table";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const classLevel = (session.user as { classLevel?: string }).classLevel;
  if (!classLevel) redirect("/onboarding");

  const data = await getDashboardData(session.user.id, classLevel);
  const name = session.user.name ?? "Student";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", paddingBottom: "32px" }}>
      <GreetingHeader name={name} />

      <HeroCard
        streak={data.analytics.streak}
        activeFlow={
          data.activeFlow
            ? {
                slug: data.activeFlow.slug,
                topic: data.activeFlow.topic,
                currentSubsectionIndex: data.activeFlow.currentSubsectionIndex,
                totalSubsections: data.activeFlow.totalSubsections,
                subject: data.activeFlow.subject,
              }
            : null
        }
      />

      <MetricsPanel
        streak={data.analytics.streak}
        sessionsThisWeek={data.sessionsThisWeek}
        overallAccuracy={data.analytics.overallAccuracy}
        examReadiness={data.analytics.examReadiness}
        weakestSubject={data.analytics.weakTopics[0] ?? null}
        mistakesOutstanding={data.mistakesOutstanding}
        mistakesResolvedThisWeek={data.mistakesResolvedThisWeek}
      />

      <ToolsGrid />

      <RecentSessionsTable flows={data.recentFlows} />

      <ActivityFeed />
    </div>
  );
}
