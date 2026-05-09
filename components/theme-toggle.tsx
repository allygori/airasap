"use client";

import { useTheme } from "next-themes";
import { Sun01Icon, Moon02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

type ThemeToggleProps = {
  className?: string;
  tone?: "default" | "b2";
};

export function ThemeToggle({ className = "", tone = "default" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label="Ganti tema"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`group inline-flex h-11 w-11 items-center justify-center text-foreground backdrop-blur transition hover:-translate-y-0.5 border-0 shadow-none ${className}`}
    >
      <HugeiconsIcon
        icon={isDark ? Moon02Icon : Sun01Icon}
        size={20}
        className="transition group-hover:scale-110"
      />
    </button>
  );
}
