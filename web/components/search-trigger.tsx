"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Search, CommandIcon, Plus } from "@hugeicons/core-free-icons";

type SearchTriggerProps = {
  onClick: () => void;
};

export function SearchTrigger({ onClick }: SearchTriggerProps) {
  return (
    <div className="relative w-[16rem]">
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center py-2 px-4 pl-12 rounded-xl bg-white dark:bg-zinc-900/60 shadow-lg shadow-zinc-200/5 dark:shadow-zinc-800/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-100 dark:focus-visible:ring-zinc-400/10 dark:focus-visible:ring-offset-zinc-900 cursor-pointer active:scale-[0.98] transition-all duration-150"
      >
        <HugeiconsIcon icon={Search} className="absolute top-1/2 left-4 -translate-y-1/2 text-neutral-500" size={19} strokeWidth={2.5} />
        <span className="text-sm text-muted-foreground">Search</span>
      </button>
      <div className="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 flex items-center space-x-1 bg-neutral-300/60 dark:bg-neutral-900/80 px-2 py-1.5 rounded-md">
        <HugeiconsIcon icon={CommandIcon} className="text-zinc-500" size={16} strokeWidth={2.5} />
        <HugeiconsIcon icon={Plus} className="text-zinc-500" size={16} strokeWidth={2.5} />
        <span className="text-xs text-zinc-500">K</span>
      </div>
    </div>
  );
}
