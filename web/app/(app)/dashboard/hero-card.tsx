import Link from "next/link";
import { StreakChip } from "./streak-chip";

type HeroCardProps = {
  streak: number;
  activeFlow: {
    slug: string;
    topic: string;
    currentSubsectionIndex: number;
    totalSubsections: number;
    subject: string;
  } | null;
};

export function HeroCard({ streak, activeFlow }: HeroCardProps) {
  if (activeFlow) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-indigo-900 p-8 text-primary-foreground">
        <div className="relative z-10 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-primary-foreground/70">
            {activeFlow.subject}
          </p>
          <h2 className="font-serif text-2xl font-medium leading-tight">
            Continue: {activeFlow.topic}
          </h2>
          <p className="text-sm text-primary-foreground/80">
            Subsection {activeFlow.currentSubsectionIndex + 1} of {activeFlow.totalSubsections}
          </p>
          <Link
            href={`/flow/${activeFlow.slug}`}
            className="inline-flex items-center gap-2 rounded-xl bg-white/80 px-5 py-2.5 text-sm font-medium text-black backdrop-blur-sm transition-all hover:bg-white/90 active:scale-[0.98]"
          >
            Resume flow
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
        <StreakChip streak={streak} />
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/5" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-primary to-primary/80 p-8 text-primary-foreground">
      <div className="relative z-10 space-y-4">
        <h2 className="font-serif text-2xl font-medium leading-tight">
          Ready to learn something new?
        </h2>
        <p className="text-sm text-primary-foreground/80">
          Start a guided study flow on any WAEC/JAMB topic.
        </p>
        <Link
          href="/dashboard?start-flow=true"
          className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-5 py-2.5 text-sm font-medium backdrop-blur-sm transition-all hover:bg-white/30 active:scale-[0.98]"
        >
          Start a Flow
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
      <StreakChip streak={streak} />
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
      <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/5" />
    </div>
  );
}
