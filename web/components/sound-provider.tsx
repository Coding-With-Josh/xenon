"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { bind, setEnabled as cuelumeSetEnabled, play } from "cuelume";

const STORAGE_KEY = "xenon.soundEffects";

type SoundContextValue = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

export function useSound(): SoundContextValue {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound must be used within SoundProvider");
  return ctx;
}

function readStored(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Default off — the safe silence. A student's first surprise should never be noise.
  const [enabled, setEnabledState] = useState<boolean>(() => readStored());
  const isExam = pathname?.startsWith("/exam") ?? false;

  // Wire Cuelume's attribute delegation once.
  useEffect(() => {
    bind();
  }, []);

  // Reflect preference to Cuelume. Forced off inside Exam Simulation regardless of the toggle.
  useEffect(() => {
    cuelumeSetEnabled(enabled && !isExam);
  }, [enabled, isExam]);

  const setEnabled = useCallback(
    (next: boolean) => {
      setEnabledState(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      } catch {
        /* ignore storage failures (private mode, etc.) */
      }
      // Apply immediately so the gesture that turns sound on is itself heard
      // (e.g. the toggle's own click cue). Inside Exam Simulation we stay silent.
      if (next && !isExam) {
        cuelumeSetEnabled(true);
        play("toggle");
      } else {
        cuelumeSetEnabled(false);
      }
    },
    [isExam]
  );

  return (
    <SoundContext.Provider value={{ enabled, setEnabled }}>
      {children}
    </SoundContext.Provider>
  );
}