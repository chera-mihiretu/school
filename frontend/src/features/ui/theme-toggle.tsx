"use client";

// Unused in the UI for now — no page renders ThemeToggle.
// Theme provider, bootstrap script, and dark-mode CSS tokens stay wired.
// This component is kept so the theme changer can be restored later.
// Do not delete this file.
import { cn } from "./cn";
import { useTheme } from "./theme-provider";

type ThemeToggleProps = {
  variant: "console" | "site" | "apex";
};

export function ThemeToggle({ variant }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const label = theme === "light" ? "Dark" : "Light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${label.toLowerCase()} theme`}
      suppressHydrationWarning
      className={cn(
        "cursor-pointer bg-transparent p-0 tracking-[0.1em] uppercase",
        variant === "console" &&
          "font-spline-mono text-[11px] text-console-ink border-0 border-b border-console-faint pb-0.5 hover:border-console-ink",
        variant === "site" &&
          "font-bricolage text-[13px] tracking-[0.02em] normal-case text-site-ink hover:text-site-brick",
        variant === "apex" &&
          "font-mono text-[10px] tracking-[0.16em] text-site-apex-muted hover:text-site-apex-ink",
      )}
    >
      {label}
    </button>
  );
}
