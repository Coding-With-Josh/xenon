"use client";

import { SearchTrigger } from "@/components/search-trigger";
import { useCommandCenter } from "@/components/command-center-provider";

export function DashboardClient() {
  const { setOpen } = useCommandCenter();

  return <SearchTrigger onClick={() => setOpen(true)} />;
}
