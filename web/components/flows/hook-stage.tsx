import { getStageData, type HookData, type FlowStageProgress } from "@/lib/flows/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { BookOpen01Icon } from "@hugeicons/core-free-icons";

type HookStageProps = {
  progress: FlowStageProgress[];
  subject: string;
  topic: string;
  onAdvance: () => void;
  subsections: { name: string; id: string }[];
};

export function HookStage({ progress, subject, topic, onAdvance, subsections }: HookStageProps) {
  const hookProgress = progress.find((p) => p.stage === "hook");
  const hookData = hookProgress ? getStageData<HookData>(hookProgress) : null;
  const content = hookData?.content ?? "";

  return (
    <div className="space-y-8">
      {/* Hook card */}
      <div className="rounded-xl border border-primary/10 bg-linear-to-br from-primary/5 to-transparent p-8">
        <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wider">
          {subject}
        </p>
        <h2 className="font-serif text-3xl font-medium leading-tight">{topic}</h2>
        <p className="text-muted-foreground mt-4 text-base leading-relaxed">{content}</p>
      </div>

      {/* What you'll learn — topic structure */}
      <div className="rounded-xl border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={BookOpen01Icon} size={18} className="text-primary" />
          <h3 className="font-serif text-lg font-medium">What you&apos;ll learn</h3>
        </div>
        <div className="space-y-2">
          {subsections.map((sub, i) => (
            <div
              key={sub.id}
              className="flex items-center gap-3 rounded-lg border border-border/50 bg-card px-4 py-3 animate-in fade-in slide-in-from-bottom-1"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{sub.name}</p>
                <p className="text-xs text-muted-foreground">
                  {subject} &middot; {topic}
                </p>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onAdvance}
          className="mt-4 w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all duration-150"
        >
          Start learning &rarr;
        </button>
      </div>
    </div>
  );
}
