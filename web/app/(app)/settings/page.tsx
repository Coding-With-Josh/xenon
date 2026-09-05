"use client";

import { useSound } from "@/components/sound-provider";

export default function SettingsPage() {
  const { enabled, setEnabled } = useSound();

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <div className="space-y-2">
        <h1 className="font-serif text-3xl font-medium">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Control how Xenon feels. Changes are saved on this device only.
        </p>
      </div>

      <div className="rounded-xl border p-5 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Sound effects</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Play subtle sounds for correct answers, completed topics, and other
            moments. Off by default so no one is surprised by noise in a
            quiet room. Sound is always silent during Exam Simulation.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Sound effects"
          data-cuelume-toggle
          onClick={() => setEnabled(!enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            enabled ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    </div>
  );
}