"use client";

import Link from "next/link";

type ActivityItem = {
  type: "mistake_resolved" | "flow_completed" | "quiz_taken" | "streak_milestone";
  title: string;
  description: string;
  timestamp: string;
  href?: string;
};

const bgClass: Record<ActivityItem["type"], string> = {
  mistake_resolved: "bg-green-500/8",
  flow_completed: "bg-primary/8",
  quiz_taken: "bg-red-500/8",
  streak_milestone: "bg-purple-500/8",
};

const borderClass: Record<ActivityItem["type"], string> = {
  mistake_resolved: "border-green-500/20",
  flow_completed: "border-primary/20",
  quiz_taken: "border-red-500/20",
  streak_milestone: "border-purple-500/20",
};

const iconColorMap: Record<ActivityItem["type"], string> = {
  mistake_resolved: "text-green-400",
  flow_completed: "text-primary",
  quiz_taken: "text-red-400",
  streak_milestone: "text-purple-400",
};

function activityIcon(type: ActivityItem["type"]) {
  const color = iconColorMap[type];
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={color}
    >
      {type === "mistake_resolved" || type === "flow_completed" ? (
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      ) : type === "quiz_taken" ? (
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      ) : (
        <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      )}
    </svg>
  );
}

const recentActivity: ActivityItem[] = [
  {
    type: "quiz_taken",
    title: "Quiz completed - Photosynthesis",
    description: "Scored 7/10 on objective questions.",
    timestamp: "2 hours ago",
    href: "/quiz/1",
  },
  {
    type: "mistake_resolved",
    title: "2 mistakes auto-resolved",
    description: "Electrolysis — concept errors corrected after review.",
    timestamp: "Yesterday",
    href: "/mistakes",
  },
  {
    type: "streak_milestone",
    title: "7-day streak!",
    description: "You've studied every day for a week. Keep going!",
    timestamp: "2 days ago",
  },
];

export function ActivityFeed() {
  if (recentActivity.length === 0) {
    return (
      <div>
        <SectionHeader>Recent Activity</SectionHeader>
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">No recent activity yet.</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Take a quiz or start a Flow to see activity here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader>Recent Activity</SectionHeader>
      <div className="flex flex-col gap-2">
        {recentActivity.map((item, i) => {
          const content = (
            <div
              className={`flex items-start gap-3 rounded-xl border p-4 transition-shadow ${bgClass[item.type]} ${borderClass[item.type]}`}
              style={{ cursor: item.href ? "pointer" : "default" }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background/80">
                {activityIcon(item.type)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground/60">{item.timestamp}</span>
            </div>
          );

          if (item.href) {
            return (
              <Link key={i} href={item.href} className="block no-underline">
                {content}
              </Link>
            );
          }
          return <div key={i}>{content}</div>;
        })}
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
