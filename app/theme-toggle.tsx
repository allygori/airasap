"use client";

import { useTheme } from "next-themes";

type ThemeToggleProps = {
  className?: string;
  tone?: "default" | "b2";
};

export function ThemeToggle({ className = "", tone = "default" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const colorClass =
    tone === "b2"
      ? "hover:border-b2-secondary/70 hover:text-b2-secondary"
      : "hover:border-cta/70 hover:text-cta";

  return (
    <button
      type="button"
      aria-label="Ganti tema"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`group inline-flex h-11 w-11 items-center justify-center rounded-full border border-foreground/15 bg-surface-strong/80 text-foreground shadow-[0_12px_30px_rgba(15,23,42,0.10)] backdrop-blur transition hover:-translate-y-0.5 dark:shadow-[0_12px_30px_rgba(0,0,0,0.25)] ${colorClass} ${className}`}
    >
      <span className="relative h-5 w-5 rounded-full border-2 border-current transition group-hover:scale-95">
        <span
          className={`absolute inset-0 rounded-full bg-current transition ${
            isDark ? "scale-50" : "translate-x-2 scale-75"
          }`}
        />
      </span>
    </button>
  );
}
