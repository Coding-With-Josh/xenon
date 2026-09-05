"use client"

import { useTheme } from "next-themes"
import { HugeiconsIcon } from "@hugeicons/react"
import { Sun01Icon, Moon01Icon } from "@hugeicons/core-free-icons"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      data-cuelume-toggle
      className="grid size-7 place-items-center rounded-full text-[#1b1d24]/60 transition hover:text-[#1b1d24] dark:text-white/50 dark:hover:text-white"
      aria-label="Toggle theme"
    >
      <HugeiconsIcon icon={resolvedTheme === "dark" ? Sun01Icon : Moon01Icon} size={16} />
    </button>
  )
}
