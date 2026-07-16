"use client";

import { useTheme } from "next-themes";

type StreakChipProps = {
  streak: number;
};

export function StreakChip({ streak }: StreakChipProps) {
  const { theme } = useTheme();
  if (streak === 0) return null;

  return (
    <div className="inline-flex absolute top-4 right-4 h-10 items-center gap-2 rounded-full border border-white/20 dark:border-border bg-white/80 dark:bg-black/80 px-4">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke={theme === "dark" ? "#C4A6FF" : "#7C3AED"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
      </svg>
      <span className="text-sm font-semibold text-foreground">
        {streak} day{streak === 1 ? "" : "s"} streak
      </span>
    </div>
  );
}
