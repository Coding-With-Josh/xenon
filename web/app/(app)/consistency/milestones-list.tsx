"use client";

import { useEffect, useRef } from "react";
import { play } from "cuelume";
import type { Milestone } from "@/lib/consistency";

const SEEN_KEY = "xenon.consistencyMilestonesSeen";

function readSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeSeen(seen: Set<string>) {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    /* ignore */
  }
}

export function MilestonesList({ milestones }: { milestones: Milestone[] }) {
  const played = useRef(false);

  useEffect(() => {
    // Fire at most once per mount, only for milestones reached now that were
    // not seen before. Mirrors a factual record getting one moment of active
    // acknowledgment. setEnabled gate covers off/exam states.
    if (played.current) return;
    played.current = true;
    const seen = readSeen();
    const newlyReached = milestones.filter((m) => m.reached && !seen.has(m.id));
    writeSeen(new Set([...seen, ...milestones.filter((m) => m.reached).map((m) => m.id)]));
    if (newlyReached.length > 0) play("sparkle");
  }, [milestones]);

  const reached = milestones.filter((m) => m.reached).length;

  return (
    <>
      <h2 className="text-sm font-semibold text-foreground mb-3">
        Milestones
        <span className="text-muted-foreground font-normal ml-1">
          ({reached}/{milestones.length})
        </span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {milestones.map((m) => (
          <div
            key={m.id}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
              m.reached
                ? "border-border bg-card"
                : "border-dashed border-border bg-muted/30 opacity-60"
            }`}
          >
            <div>
              <p className="text-sm font-medium">{m.label}</p>
              {m.detail && (
                <p className="text-xs text-muted-foreground mt-0.5">{m.detail}</p>
              )}
            </div>
            <span
              className={`text-xs font-medium ${
                m.reached ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {m.reached ? "Reached" : "—"}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}