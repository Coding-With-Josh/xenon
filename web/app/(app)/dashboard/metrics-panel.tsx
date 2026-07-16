type MetricsPanelProps = {
  streak: number;
  sessionsThisWeek: number;
  overallAccuracy: number;
  examReadiness: number | null;
  weakestSubject: string | null;
  mistakesOutstanding: number;
  mistakesResolvedThisWeek: number;
};

function MetricCard({
  label,
  value,
  valueClass,
  bgClass,
  children,
}: {
  label: string;
  value: string;
  valueClass: string;
  bgClass: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`min-w-[220px] rounded-2xl p-5 ${bgClass}`}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/70 dark:text-muted-foreground">
        {label}
      </p>
      <p className={`text-4xl font-bold leading-tight ${valueClass}`}>
        {value}
      </p>
      {children}
    </div>
  );
}

export function MetricsPanel({
  streak,
  sessionsThisWeek,
  examReadiness,
  weakestSubject,
  mistakesOutstanding,
  mistakesResolvedThisWeek,
}: MetricsPanelProps) {
  return (
    <div>
      <SectionHeader>Quick stats</SectionHeader>
      <div className="grid min-[0px]:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          label="Day streak"
          value={`${streak} day${streak === 1 ? "" : "s"}`}
          valueClass="text-violet-700 dark:text-violet-400"
          bgClass="bg-violet-500/80 dark:bg-violet-700/20"
        >
          <p className="mt-1 text-sm text-white/70 dark:text-muted-foreground">
            {sessionsThisWeek} session{sessionsThisWeek === 1 ? "" : "s"} this week
          </p>
        </MetricCard>

        <MetricCard
          label="Exam readiness"
          value={examReadiness !== null ? `${examReadiness}%` : "—"}
          valueClass={examReadiness !== null ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}
          bgClass="bg-green-500/60 dark:bg-green-700/20"
        >
          <p className="mt-1 mb-3 text-sm text-white/70 dark:text-muted-foreground">
            {examReadiness !== null
              ? `Weakest: ${weakestSubject ?? "—"}`
              : "Answer a few questions to get a score"}
          </p>
          <div className="h-1.5 rounded-full bg-white/60 dark:bg-black/30 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${examReadiness !== null ? "bg-green-600 dark:bg-green-500" : "bg-muted-foreground/30"}`}
              style={{ width: `${examReadiness !== null ? Math.min(examReadiness, 100) : 0}%` }}
            />
          </div>
        </MetricCard>

        <MetricCard
          label="Mistakes open"
          value={`${mistakesOutstanding}`}
          valueClass="text-red-700 dark:text-red-400"
          bgClass="bg-red-500/60 dark:bg-red-700/20"
        >
          <p className="mt-1 text-sm text-white/70 dark:text-muted-foreground">
            {mistakesResolvedThisWeek} fixed this week
          </p>
        </MetricCard>
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}
