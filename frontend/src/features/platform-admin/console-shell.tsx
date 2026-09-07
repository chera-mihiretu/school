"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { cn } from "@/features/ui/cn";
import { useConsoleStore } from "@/stores/console-store";
import { ConsoleHostBrand, ConsoleSidebar } from "./console-sidebar";
import { ConsolePrimaryLink } from "./console-ui";

type ConsoleShellProps = {
  email: string | null;
  rootHost: string;
  activeCount: number;
  suspendedCount: number;
  children: ReactNode;
};

export function ConsoleShell({
  email,
  rootHost,
  activeCount,
  suspendedCount,
  children,
}: ConsoleShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const signedIn = email !== null;
  const focusSearch = useConsoleStore((state) => state.focusSearch);
  const drawerOpen = useConsoleStore((state) => state.drawerOpen);
  const setDrawerOpen = useConsoleStore((state) => state.setDrawerOpen);
  const navId = useId();
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const wasDrawerOpen = useRef(false);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, [setDrawerOpen]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (drawerOpen) {
      wasDrawerOpen.current = true;
      closeButtonRef.current?.focus();
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }

    if (wasDrawerOpen.current) {
      wasDrawerOpen.current = false;
      if (!window.matchMedia("(min-width: 768px)").matches) {
        openButtonRef.current?.focus();
      }
    }
  }, [drawerOpen]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (media.matches) {
        setDrawerOpen(false);
      }
    };
    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
    };
  }, []);

  useEffect(() => {
    if (!signedIn) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      const inField =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA");

      if (event.key === "Escape") {
        if (drawerOpen) {
          event.preventDefault();
          closeDrawer();
          return;
        }
        if (inField) {
          target.blur();
        }
        return;
      }

      if (inField) {
        return;
      }

      if (event.key === "/") {
        event.preventDefault();
        if (pathname === "/platform-admin/schools") {
          focusSearch();
          return;
        }
        router.push("/platform-admin/schools");
        window.setTimeout(() => {
          focusSearch();
        }, 40);
        return;
      }

      if (event.key === "c") {
        router.push("/platform-admin/schools/new");
        return;
      }

      if (event.key === "l") {
        router.push("/platform-admin/schools");
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [closeDrawer, drawerOpen, focusSearch, pathname, router, signedIn]);

  return (
    <div
      data-surface="console"
      className={cn(
        "flex min-h-full flex-1 bg-console-canvas font-spline text-console-ink antialiased",
        signedIn ? "flex-col md:flex-row" : "flex-col",
      )}
    >
      {signedIn ? (
        <div className="hidden h-auto md:flex md:sticky md:top-0 md:h-dvh md:shrink-0">
          <ConsoleSidebar
            variant="rail"
            pathname={pathname}
            rootHost={rootHost}
            email={email}
          />
        </div>
      ) : (
        <header className="sticky top-0 z-20 flex h-[54px] items-center gap-6 border-b border-console-line bg-console-surface px-5">
          <ConsoleHostBrand rootHost={rootHost} compact />
          <div className="font-spline-mono text-[10.5px] tracking-[0.14em] uppercase text-console-muted">
            Platform console
          </div>
          <div className="flex-1" />
          {pathname === "/platform-admin/login" ? null : (
            <ConsolePrimaryLink
              href="/platform-admin/login"
              className="px-4 py-2"
            >
              Log in
            </ConsolePrimaryLink>
          )}
        </header>
      )}

      {signedIn ? (
        <header
          inert={drawerOpen}
          className="sticky top-0 z-20 flex h-[54px] items-center gap-3 border-b border-console-line bg-console-surface px-4 md:hidden"
        >
          <button
            ref={openButtonRef}
            type="button"
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            aria-controls={navId}
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center border border-console-line bg-transparent"
          >
            <MenuGlyph />
          </button>
          <ConsoleHostBrand rootHost={rootHost} compact />
        </header>
      ) : null}

      {signedIn && drawerOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-console-overlay md:hidden"
          onClick={closeDrawer}
        />
      ) : null}

      {signedIn ? (
        <div
          inert={!drawerOpen}
          aria-hidden={!drawerOpen}
          className={cn(
            "fixed inset-y-0 left-0 z-40 md:hidden",
            "transition-transform duration-200 ease-out motion-reduce:transition-none",
            drawerOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <ConsoleSidebar
            variant="drawer"
            navId={navId}
            pathname={pathname}
            rootHost={rootHost}
            email={email}
            onNavigate={closeDrawer}
            onClose={closeDrawer}
            closeButtonRef={closeButtonRef}
          />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col" inert={drawerOpen}>
        <div className="flex flex-1 flex-col">{children}</div>

        {signedIn ? (
          <div className="sticky bottom-0 flex flex-wrap items-center gap-4 border-t border-console-line bg-console-surface px-7 py-[11px] font-spline-mono text-[10.5px] tracking-[0.1em] uppercase text-console-faint">
            <span>admin.{rootHost}</span>
            <span className="text-console-line">/</span>
            <span>Keys · / filter · c create · l list · esc dismiss</span>
            <div className="flex-1" />
            <span>
              {activeCount} active · {suspendedCount} suspended
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MenuGlyph() {
  return (
    <span aria-hidden className="flex flex-col gap-1">
      <span className="block h-px w-4 bg-console-ink" />
      <span className="block h-px w-4 bg-console-ink" />
      <span className="block h-px w-4 bg-console-ink" />
    </span>
  );
}
