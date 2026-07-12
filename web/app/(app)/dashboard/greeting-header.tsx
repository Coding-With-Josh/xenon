"use client";

import { SearchTrigger } from "@/components/search-trigger";
import { useCommandCenter } from "@/components/command-center-provider";

export function GreetingHeader({ name }: { name: string }) {
  const { setOpen } = useCommandCenter();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="font-serif text-2xl font-medium">Hey, {name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Let's get into it.</p>
      </div>
      <div className="hidden sm:block">
        <SearchTrigger onClick={() => setOpen(true)} />
      </div>
    </div>
  );
}