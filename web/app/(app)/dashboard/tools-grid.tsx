"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BookOpen01Icon,
  BrainIcon,
  CertificateIcon,
  ChatIcon,
  DangerIcon,
} from "@hugeicons/core-free-icons";

type ToolDef = {
  title: string;
  description: string;
  href: string;
  icon: typeof BookOpen01Icon;
  accent: string;
};

const tools: ToolDef[] = [
  {
    title: "Notes",
    description: "Your notes, in one place",
    href: "/notes",
    icon: BookOpen01Icon,
    accent: "border-l-indigo-500/50",
  },
  {
    title: "Quiz",
    description: "Run a quick quiz on any topic",
    href: "/quiz",
    icon: BrainIcon,
    accent: "border-l-emerald-500/50",
  },
  {
    title: "Exam Simulation",
    description: "Sit a timed WAEC or JAMB paper",
    href: "/exam",
    icon: CertificateIcon,
    accent: "border-l-amber-500/50",
  },
  {
    title: "Chat",
    description: "Ask Xe anything, get a clear answer",
    href: "/chat",
    icon: ChatIcon,
    accent: "border-l-cyan-500/50",
  },
  {
    title: "Mistakes",
    description: "The ones you got wrong, sorted",
    href: "/mistakes",
    icon: DangerIcon,
    accent: "border-l-rose-500/50",
  },
];

const iconColor: Record<string, string> = {
  Notes: "text-indigo-400",
  Quiz: "text-emerald-400",
  "Exam Simulation": "text-amber-400",
  Chat: "text-cyan-400",
  Mistakes: "text-rose-400",
};

const iconBg: Record<string, string> = {
  Notes: "bg-indigo-500/10",
  Quiz: "bg-emerald-500/10",
  "Exam Simulation": "bg-amber-500/10",
  Chat: "bg-cyan-500/10",
  Mistakes: "bg-rose-500/10",
};

export function ToolsGrid() {
  return (
    <div>
      <SectionHeader>Tools</SectionHeader>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {tools.map((tool) => (
          <Link
            key={tool.title}
            href={tool.href}
            className={`group relative flex items-center gap-4 rounded-xl border border-border ${tool.accent} border-l-[3px] bg-gradient-to-r from-transparent via-transparent to-muted/10 p-4 min-h-[56px] transition-all duration-200 hover:bg-muted/20 active:scale-[0.98]`}
            style={{ textDecoration: "none" }}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg[tool.title]} ${iconColor[tool.title]}`}
            >
              <HugeiconsIcon icon={tool.icon} size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium text-foreground">
                {tool.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {tool.description}
              </p>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground/70"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        ))}
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
