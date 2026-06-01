"use client";

import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const handleToggle = () => {
    const current = document.documentElement.dataset.theme || "light";
    const next = current === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
  };

  return (
    <button
      onClick={handleToggle}
      type="button"
      className="h-10 w-10 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-variant)] flex items-center justify-center text-muted hover:text-[var(--color-on-surface)] transition-all cursor-pointer"
      aria-label="Toggle theme"
    >
      <Sun className="h-4.5 w-4.5 text-amber-500 hidden dark-theme-show" />
      <Moon className="h-4.5 w-4.5 text-[var(--color-secondary)] dark-theme-hide" />
    </button>
  );
}
