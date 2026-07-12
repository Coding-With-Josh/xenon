"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, Search } from "@hugeicons/core-free-icons";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useCommandCenter } from "@/components/command-center-provider";
import Sidebar from "@/components/blocks/sidebar";

export function MobileTopBar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { setOpen: setCommandOpen } = useCommandCenter();

  return (
    <div className="sm:hidden fixed top-0 inset-x-0 z-40 flex items-center gap-2 px-3 h-14 bg-[#ebebed] dark:bg-[#0f0f12]">
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open navigation"
            className="shrink-0 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900/60 shadow-sm size-10 active:scale-[0.98] transition-all"
          >
            <HugeiconsIcon icon={Menu01Icon} className="text-neutral-700 dark:text-neutral-200" size={20} strokeWidth={2.5} />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="h-full overflow-y-auto pt-4">
            <Sidebar forceExpanded onNavigate={() => setDrawerOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="flex-1 flex items-center gap-2 rounded-xl bg-white dark:bg-zinc-900/60 shadow-sm px-3 h-10 active:scale-[0.98] transition-all"
      >
        <HugeiconsIcon icon={Search} className="text-neutral-500 shrink-0" size={18} strokeWidth={2.5} />
        <span className="text-sm text-muted-foreground">Search or jump to…</span>
      </button>
    </div>
  );
}