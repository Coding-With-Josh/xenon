"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { CommandCenter } from "@/components/command-center";

type CommandCenterContext = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const Ctx = createContext<CommandCenterContext | null>(null);

export function useCommandCenter() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCommandCenter must be used within CommandCenterProvider");
  return ctx;
}

export function CommandCenterProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const handleOpenChange = useCallback((o: boolean) => setOpen(o), []);

  return (
    <Ctx.Provider value={{ open, setOpen }}>
      {children}
      <CommandCenter open={open} onOpenChange={handleOpenChange} />
    </Ctx.Provider>
  );
}
