import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserFlows } from "@/lib/flows-data";
import { FlowsPageClient } from "./flows-page-client";

export default async function FlowsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const classLevel = (session.user as { classLevel?: string }).classLevel;
  if (!classLevel) redirect("/onboarding");

  const data = await getUserFlows(session.user.id);

  const hasAnyFlows =
    data.inProgress.length > 0 ||
    Object.keys(data.completed).length > 0 ||
    data.abandoned.length > 0;

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="font-serif text-2xl font-medium">My Flows</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {hasAnyFlows
            ? "Your guided study sessions — pick up where you left off or review what you've mastered."
            : "Start your first guided study session on any WAEC/JAMB topic."}
        </p>
      </div>

      <FlowsPageClient
        initialData={data}
        classLevel={classLevel}
        hasAnyFlows={hasAnyFlows}
      />
    </div>
  );
}