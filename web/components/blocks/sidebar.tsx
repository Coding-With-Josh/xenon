"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  PathIcon,
  Compass01Icon,
  FireIcon,
  Cancel01Icon,
  NoteIcon,
  ChatQuestion01Icon,
  Clock01Icon,
  Message01Icon,
  Notification01Icon,
  BarChartIcon,
  Settings01Icon,
  ChatFeedbackIcon,
} from "@hugeicons/core-free-icons";

const sections = [
  {
    label: "Learn",
    items: [
      { label: "My Journeys", href: "/journeys", icon: PathIcon, comingSoon: true },
      { label: "My Flows", href: "/flow", icon: Compass01Icon },
      { label: "My Consistency", href: "/consistency", icon: FireIcon },
      { label: "Mistakes", href: "/mistakes", icon: Cancel01Icon },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "Notes", href: "/notes", icon: NoteIcon },
      { label: "Quizzes", href: "/quiz", icon: ChatQuestion01Icon },
      { label: "Exam Simulation", href: "/exam", icon: Clock01Icon },
      { label: "Xe AI", href: "/chat", icon: Message01Icon },
    ],
  },
];

const secondarySections = [
  {
    label: "Other",
    items: [
      { label: "Notifications", href: "/notifications", icon: Notification01Icon },
      { label: "Analytics", href: "/analytics", icon: BarChartIcon },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Settings", href: "/settings", icon: Settings01Icon },
      { label: "Feedback", href: "/feedback", icon: ChatFeedbackIcon },
    ],
  },
];

type SidebarProps = {
  /** When true (e.g. inside the mobile drawer) force full-width expanded layout. */
  forceExpanded?: boolean;
  /** Optional callback fired when a nav item is clicked (used to close the drawer). */
  onNavigate?: () => void;
};

type SectionType = (typeof sections)[number];
type NavItemType = SectionType["items"][number];

export default function Sidebar({ forceExpanded = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  // On tablet (sm, not lg) the sidebar collapses to icon-only unless forceExpanded.
  const expanded = forceExpanded;
  const widthClass = expanded ? "w-[15rem]" : "w-16 lg:w-[15rem]";
  const labelClass = expanded ? "inline" : "hidden lg:inline";
  const sectionLabelClass = expanded ? "block" : "hidden lg:block";
  const itemJustify = expanded ? "justify-start" : "justify-center lg:justify-start";

  function isActive(href: string): boolean {
    if (href === "/dashboard") {
      return pathname?.startsWith("/dashboard/") ?? false;
    }
    return pathname === href || pathname?.startsWith(href + "/");
  }

  function renderNavItems(items: NavItemType[]) {
    return items.map((item) => {
      const active = isActive(item.href);
      const className = `flex tracking-[0.005em] items-center gap-3 rounded-lg px-4 py-2 text-xs transition-colors ${itemJustify} ${
        item.comingSoon
          ? "text-muted-foreground/50 cursor-not-allowed"
          : active
            ? "bg-black/5 dark:bg-white/10 font-medium text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
      }`;
      if (item.comingSoon) {
        return (
          <li key={item.href}>
            <span className={className}>
              <HugeiconsIcon icon={item.icon} size={16} className="shrink-0" />
              <span className={`${labelClass}`}>{item.label}</span>
              <span className={`ml-auto text-[10px] font-medium text-muted-foreground/40 ${labelClass}`}>
                Soon
              </span>
            </span>
          </li>
        );
      }
      return (
        <li key={item.href}>
          <Link href={item.href} onClick={onNavigate} className={className}>
            <HugeiconsIcon icon={item.icon} size={16} className="shrink-0" />
            <span className={`${labelClass}`}>{item.label}</span>
          </Link>
        </li>
      );
    });
  }

  function renderSection(section: SectionType) {
    const sectionActive = section.items.some((item) => isActive(item.href));
    return (
      <div key={section.label}>
        <span
          className={`text-[12px] font-semibold tracking-wide uppercase py-1 block transition-colors ${sectionLabelClass} ${
            sectionActive ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {section.label}
        </span>
        <ul className="mt-1 flex flex-col gap-[2px]">
          {renderNavItems(section.items)}
        </ul>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col gap-6 px-6 ${widthClass}`}>
      {/* Logo */}
      <Link href="/dashboard" onClick={onNavigate} className="pt-2">
        <span className={`font-serif text-2xl font-semibold tracking-tight ${labelClass}`}>
          Xenon
        </span>
      </Link>

      {/* Home */}
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className={`mt-3 flex tracking-[0.005em] items-center gap-3 rounded-lg px-4 py-2 text-xs transition-colors ${itemJustify} ${
          pathname === "/dashboard" || pathname === "/"
            ? "bg-black/5 dark:bg-white/10 font-medium text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
        }`}
      >
        <HugeiconsIcon icon={Home01Icon} size={16} className="shrink-0" />
        <span className={`${labelClass}`}>Home</span>
      </Link>

      {/* Primary sections */}
      <nav className="flex flex-col gap-4">
        {sections.map(renderSection)}
      </nav>

      {/* Secondary sections */}
      <nav className="flex flex-col gap-4">
        {secondarySections.map(renderSection)}
      </nav>
    </div>
  );
}