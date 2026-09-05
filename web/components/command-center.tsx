"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
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
  Search,
  BoltIcon,
  Rocket01Icon,
  GraduationCap,
} from "@hugeicons/core-free-icons";

const navigateItems = [
  { label: "Home", href: "/dashboard", icon: Home01Icon },
  { label: "My Journeys", href: "/journeys", icon: PathIcon },
  { label: "My Flows", href: "/flow", icon: Compass01Icon },
  { label: "My Streak", href: "/dashboard", icon: FireIcon },
  { label: "Mistakes", href: "/mistakes", icon: Cancel01Icon },
  { label: "Notes", href: "/notes", icon: NoteIcon },
  { label: "Quizzes", href: "/quiz", icon: ChatQuestion01Icon },
  { label: "Exam Simulation", href: "/exam", icon: Clock01Icon },
  { label: "Xe AI", href: "/chat", icon: Message01Icon },
  { label: "Notifications", href: "/notifications", icon: Notification01Icon },
  { label: "Analytics", href: "/analytics", icon: BarChartIcon },
  { label: "Settings", href: "/settings", icon: Settings01Icon },
  { label: "Feedback", href: "/feedback", icon: ChatFeedbackIcon },
];

const actionItems = [
  { label: "Generate Quiz", action: "generate-quiz", icon: BoltIcon },
  { label: "Start Study Plan", action: "start-study-plan", icon: Rocket01Icon },
  { label: "Take Exam", action: "take-exam", icon: GraduationCap },
];

type CommandCenterProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandCenter({ open, onOpenChange }: CommandCenterProps) {
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const runAction = useCallback(
    (action: string) => {
      onOpenChange(false);
      switch (action) {
        case "generate-quiz":
          router.push("/quiz");
          break;
        case "start-study-plan":
          router.push("/dashboard");
          break;
        case "take-exam":
          router.push("/exam");
          break;
      }
    },
    [router, onOpenChange]
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-[15%] -translate-x-1/2 w-full max-w-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-2 duration-200">
          <Command className="rounded-2xl border border-border bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden">
            <div className="flex items-center border-b border-border px-4">
              <HugeiconsIcon icon={Search} className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Command.Input
                placeholder="Search or jump to..."
                className="flex-1 bg-transparent px-3 py-4 text-sm outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>

            <Command.List className="max-h-80 overflow-y-auto p-2">
              <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                No results found.
              </Command.Empty>

              <Command.Group heading="Navigate" className="py-4 pl-2">
                {navigateItems.map((item) => (
                  <Command.Item
                    key={item.href}
                    value={item.label}
                    onSelect={() => {
                      onOpenChange(false);
                      router.push(item.href);
                    }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground data-[selected=true]:bg-muted cursor-pointer transition-colors"
                  >
                    <HugeiconsIcon icon={item.icon} size={16} className="text-muted-foreground shrink-0" />
                    {item.label}
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Separator className="mx-2 my-2 h-px bg-border" />

              <Command.Group heading="Actions" className="pb-4 pt-2 pl-2">
                {actionItems.map((item) => (
                  <Command.Item
                    key={item.action}
                    value={item.label}
                    onSelect={() => runAction(item.action)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground data-[selected=true]:bg-muted cursor-pointer transition-colors"
                  >
                    <HugeiconsIcon icon={item.icon} size={16} className="text-muted-foreground shrink-0" />
                    {item.label}
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>

            <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono font-medium">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono font-medium">↵</kbd>
                open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono font-medium">esc</kbd>
                close
              </span>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
