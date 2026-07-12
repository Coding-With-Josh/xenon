import type { FlowListItem } from "@/lib/flows-data";
import { FlowRow } from "./flow-row";

type CompletedGroupsProps = {
  groups: Record<string, FlowListItem[]>;
};

export function CompletedGroups({ groups }: CompletedGroupsProps) {
  const subjectKeys = Object.keys(groups);
  const totalCompleted = subjectKeys.reduce((sum, key) => sum + groups[key].length, 0);

  if (totalCompleted === 0) {
    return (
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">Completed</h2>
        <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing completed yet — keep going!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-foreground mb-3">
        Completed
        <span className="text-muted-foreground font-normal ml-1">({totalCompleted})</span>
      </h2>
      <div className="space-y-4">
        {subjectKeys.map((subject) => (
          <div key={subject}>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {subject}
            </h3>
            <div className="space-y-2">
              {groups[subject].map((flow) => (
                <FlowRow key={flow.id} flow={flow} variant="completed" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}