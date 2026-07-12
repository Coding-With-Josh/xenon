import type { FlowListItem } from "@/lib/flows-data";
import { FlowRow } from "./flow-row";

type InProgressListProps = {
  items: FlowListItem[];
  onRefresh: () => void;
};

export function InProgressList({ items, onRefresh }: InProgressListProps) {
  if (items.length === 0) {
    return (
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">In Progress</h2>
        <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">All caught up! Start a new Flow to begin studying.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-foreground mb-3">
        In Progress
        <span className="text-muted-foreground font-normal ml-1">({items.length})</span>
      </h2>
      <div className="space-y-2">
        {items.map((flow) => (
          <FlowRow key={flow.id} flow={flow} variant="in-progress" onRefresh={onRefresh} />
        ))}
      </div>
    </section>
  );
}