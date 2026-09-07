"use client";

import Link from "next/link";
import type { Ref } from "react";
import { cn } from "@/features/ui/cn";
import { NetworkMark } from "@/features/ui/network-mark";
import { CampusSignOutButton } from "./campus-sign-out-button";
import {
  CAMPUS_DIRECTOR_NAV_ITEMS,
  isCampusDirectorNavActive,
} from "./campus-director-nav";

export function CampusDirectorBrand({
  slug,
  rootHost,
  compact = false,
}: {
  slug: string;
  rootHost: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center", compact ? "gap-3" : "gap-2.5")}>
      <NetworkMark size={compact ? 22 : 24} decorative />
      <div className="flex min-w-0 items-baseline gap-px font-mono text-[13px] tracking-[0.02em]">
        <span className="font-medium text-site-brick">{slug}</span>
        <span className="truncate text-site-muted">.{rootHost}</span>
      </div>
    </div>
  );
}

type CampusDirectorSidebarProps = {
  pathname: string;
  schoolName: string;
  slug: string;
  rootHost: string;
  email: string;
  variant: "rail" | "drawer";
  navId?: string;
  onNavigate?: () => void;
  onClose?: () => void;
  closeButtonRef?: Ref<HTMLButtonElement>;
};

export function CampusDirectorSidebar({
  pathname,
  schoolName,
  slug,
  rootHost,
  email,
  variant,
  navId,
  onNavigate,
  onClose,
  closeButtonRef,
}: CampusDirectorSidebarProps) {
  const isDrawer = variant === "drawer";

  return (
    <aside
      id={navId}
      role={isDrawer ? "dialog" : undefined}
      aria-modal={isDrawer ? true : undefined}
      aria-label="School navigation"
      className="flex h-full w-[232px] shrink-0 flex-col overflow-y-auto border-r border-site-line bg-site-canvas"
    >
      <div className="flex items-start justify-between gap-2 border-b border-site-line px-5 py-5">
        <div className="min-w-0">
          <CampusDirectorBrand slug={slug} rootHost={rootHost} />
          <div className="mt-3 font-newsreader text-[17px] leading-snug text-site-ink">
            {schoolName}
          </div>
        </div>
        {isDrawer ? (
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center border border-site-line bg-transparent text-site-ink"
          >
            <CloseGlyph />
          </button>
        ) : null}
      </div>

      <nav aria-label="Director" className="flex flex-col gap-1.5 px-4 py-5">
        {CAMPUS_DIRECTOR_NAV_ITEMS.map((item) => {
          const on = isCampusDirectorNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={on ? "page" : undefined}
              className={cn(
                "cursor-pointer border px-3 py-2 font-mono text-[10.5px] tracking-[0.1em] uppercase no-underline",
                on
                  ? "border-site-brick bg-site-brick text-site-on-brick"
                  : "border-site-line bg-transparent text-site-muted hover:border-site-brick hover:text-site-ink",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-site-line px-5 py-4">
        <span
          className="truncate font-mono text-xs text-site-muted"
          title={email}
        >
          {email}
        </span>
        <CampusSignOutButton />
      </div>
    </aside>
  );
}

function CloseGlyph() {
  return (
    <span aria-hidden className="relative block h-3 w-3">
      <span className="absolute top-1/2 left-0 block h-px w-full -translate-y-1/2 rotate-45 bg-site-ink" />
      <span className="absolute top-1/2 left-0 block h-px w-full -translate-y-1/2 -rotate-45 bg-site-ink" />
    </span>
  );
}
