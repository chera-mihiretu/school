"use client";

import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { cn } from "@/features/ui/cn";
import { useCampusDashboardStore } from "@/stores/campus-dashboard-store";
import {
  CampusDirectorBrand,
  CampusDirectorSidebar,
} from "./campus-director-sidebar";

type CampusDirectorShellProps = {
  schoolName: string;
  slug: string;
  rootHost: string;
  email: string;
  children: ReactNode;
};

export function CampusDirectorShell({
  schoolName,
  slug,
  rootHost,
  email,
  children,
}: CampusDirectorShellProps) {
  const pathname = usePathname();
  const drawerOpen = useCampusDashboardStore((state) => state.drawerOpen);
  const setDrawerOpen = useCampusDashboardStore((state) => state.setDrawerOpen);
  const navId = useId();
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasDrawerOpen = useRef(false);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, [setDrawerOpen]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname, setDrawerOpen]);

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
  }, [setDrawerOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && drawerOpen) {
        event.preventDefault();
        closeDrawer();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [closeDrawer, drawerOpen]);

  return (
    <div
      data-surface="site"
      className="flex min-h-full flex-1 flex-col bg-site-canvas font-newsreader text-site-ink antialiased md:flex-row"
    >
      <div className="hidden h-auto md:flex md:sticky md:top-0 md:h-dvh md:shrink-0">
        <CampusDirectorSidebar
          variant="rail"
          pathname={pathname}
          schoolName={schoolName}
          slug={slug}
          rootHost={rootHost}
          email={email}
        />
      </div>

      <header
        inert={drawerOpen}
        className="sticky top-0 z-20 flex h-[54px] items-center gap-3 border-b border-site-line bg-site-canvas px-4 md:hidden"
      >
        <button
          ref={openButtonRef}
          type="button"
          aria-label="Open navigation"
          aria-expanded={drawerOpen}
          aria-controls={navId}
          onClick={() => setDrawerOpen(true)}
          className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center border border-site-line bg-transparent"
        >
          <MenuGlyph />
        </button>
        <CampusDirectorBrand slug={slug} rootHost={rootHost} compact />
      </header>

      {drawerOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-site-ink/45 md:hidden"
          onClick={closeDrawer}
        />
      ) : null}

      <div
        inert={!drawerOpen}
        aria-hidden={!drawerOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-40 md:hidden",
          "transition-transform duration-200 ease-out motion-reduce:transition-none",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <CampusDirectorSidebar
          variant="drawer"
          navId={navId}
          pathname={pathname}
          schoolName={schoolName}
          slug={slug}
          rootHost={rootHost}
          email={email}
          onNavigate={closeDrawer}
          onClose={closeDrawer}
          closeButtonRef={closeButtonRef}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col" inert={drawerOpen}>
        <main className="flex w-full min-w-0 flex-1 flex-col px-6 pb-16 pt-10 sm:px-10 lg:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}

function MenuGlyph() {
  return (
    <span aria-hidden className="flex flex-col gap-1">
      <span className="block h-px w-4 bg-site-ink" />
      <span className="block h-px w-4 bg-site-ink" />
      <span className="block h-px w-4 bg-site-ink" />
    </span>
  );
}
