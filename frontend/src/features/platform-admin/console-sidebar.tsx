"use client";

import Link from "next/link";
import type { Ref } from "react";
import { cn } from "@/features/ui/cn";
import { NetworkMark } from "@/features/ui/network-mark";
import { signOutPlatformAdmin } from "./actions";

export const CONSOLE_NAV_ITEMS = [
  { href: "/platform-admin", label: "Dashboard" },
  { href: "/platform-admin/schools", label: "Schools" },
  { href: "/platform-admin/featured", label: "Featured" },
  { href: "/platform-admin/messages", label: "Messages" },
] as const;

export function isConsoleNavActive(pathname: string, href: string): boolean {
  if (href === "/platform-admin") {
    return pathname === "/platform-admin";
  }
  if (href === "/platform-admin/schools") {
    return pathname === "/platform-admin/schools";
  }
  return pathname === href;
}

export function ConsoleHostBrand({
  rootHost,
  compact = false,
}: {
  rootHost: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center", compact ? "gap-3" : "gap-2.5")}>
      <NetworkMark
        size={compact ? 22 : 24}
        decorative
        className="text-console-ink"
      />
      {compact ? <div className="h-5 w-px bg-console-line" /> : null}
      <div className="flex min-w-0 items-baseline gap-px font-spline-mono text-[13px] tracking-[0.02em]">
        <span className="font-medium text-console-accent">admin</span>
        <span className="truncate text-console-muted">.{rootHost}</span>
      </div>
    </div>
  );
}

type ConsoleSidebarProps = {
  pathname: string;
  rootHost: string;
  email: string;
  variant: "rail" | "drawer";
  navId?: string;
  onNavigate?: () => void;
  onClose?: () => void;
  closeButtonRef?: Ref<HTMLButtonElement>;
};

export function ConsoleSidebar({
  pathname,
  rootHost,
  email,
  variant,
  navId,
  onNavigate,
  onClose,
  closeButtonRef,
}: ConsoleSidebarProps) {
  const isDrawer = variant === "drawer";

  return (
    <aside
      id={navId}
      role={isDrawer ? "dialog" : undefined}
      aria-modal={isDrawer ? true : undefined}
      aria-label="Platform navigation"
      className="flex h-full w-[232px] shrink-0 flex-col overflow-y-auto border-r border-console-line bg-console-surface"
    >
      <div className="flex items-start justify-between gap-2 border-b border-console-line px-5 py-5">
        <div className="min-w-0">
          <ConsoleHostBrand rootHost={rootHost} />
          <div className="mt-3 font-spline-mono text-[10.5px] tracking-[0.14em] uppercase text-console-muted">
            Platform console
          </div>
        </div>
        {isDrawer ? (
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center border border-console-line bg-transparent text-console-ink"
          >
            <CloseGlyph />
          </button>
        ) : null}
      </div>

      <nav aria-label="Console" className="flex flex-col gap-1.5 px-4 py-5">
        {CONSOLE_NAV_ITEMS.map((item) => {
          const on = isConsoleNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={on ? "page" : undefined}
              className={cn(
                "cursor-pointer border px-3 py-2 font-spline-mono text-[10.5px] tracking-[0.1em] uppercase",
                on
                  ? "border-console-primary bg-console-primary text-console-on-primary"
                  : "border-console-line bg-transparent text-console-muted hover:border-console-muted hover:text-console-ink",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-console-line px-5 py-4">
        <span
          className="truncate font-spline-mono text-xs text-console-muted"
          title={email}
        >
          {email}
        </span>
        <form action={signOutPlatformAdmin}>
          <button
            type="submit"
            className="cursor-pointer border-0 border-b border-console-faint bg-transparent p-0 pb-0.5 font-spline-mono text-[11px] tracking-[0.1em] uppercase text-console-ink hover:border-console-ink"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

function CloseGlyph() {
  return (
    <span aria-hidden className="relative block h-3 w-3">
      <span className="absolute top-1/2 left-0 block h-px w-full -translate-y-1/2 rotate-45 bg-console-ink" />
      <span className="absolute top-1/2 left-0 block h-px w-full -translate-y-1/2 -rotate-45 bg-console-ink" />
    </span>
  );
}
