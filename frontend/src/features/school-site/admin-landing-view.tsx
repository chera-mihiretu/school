import { ConsoleKicker, ConsolePrimaryLink } from "@/features/platform-admin/console-ui";
import { NetworkMark } from "@/features/ui/network-mark";

export function AdminLandingView({
  host,
  rootHost,
}: {
  host: string;
  rootHost: string;
}) {
  return (
    <div
      data-surface="console"
      className="flex min-h-full flex-col bg-console-canvas font-spline text-console-ink antialiased"
    >
      <header className="sticky top-0 z-20 flex h-[54px] items-center gap-6 border-b border-console-line bg-console-surface px-5">
        <div className="flex min-w-0 items-center gap-3">
          <NetworkMark size={22} decorative className="text-console-ink" />
          <div className="h-5 w-px bg-console-line" />
          <div className="flex min-w-0 items-baseline gap-px font-spline-mono text-[13px] tracking-[0.02em]">
            <span className="font-medium text-console-accent">admin</span>
            <span className="truncate text-console-muted">.{rootHost}</span>
          </div>
        </div>
        <div className="font-spline-mono text-[10.5px] tracking-[0.14em] uppercase text-console-muted">
          Platform console
        </div>
        <div className="flex-1" />
        <ConsolePrimaryLink href="/platform-admin/login" className="px-4 py-2">
          Log in
        </ConsolePrimaryLink>
      </header>

      <main className="flex flex-1 justify-center px-7 pb-10 pt-[10vh]">
        <section className="w-full max-w-[392px] animate-ome-rise">
          <ConsoleKicker className="mb-[22px] text-console-accent">
            Restricted
          </ConsoleKicker>
          <h1 className="mb-2.5 text-[34px] font-medium leading-tight tracking-[-0.02em]">
            Platform console
          </h1>
          <p className="mb-10 max-w-[34ch] text-[14.5px] leading-relaxed text-console-muted">
            Operators sign in here. Each school has its own address and landing;
            this host is only for the platform.
          </p>
          <p className="mb-10 font-spline-mono text-[12px] tracking-[0.04em] text-console-faint">
            {host}
          </p>
          <ConsolePrimaryLink
            href="/platform-admin/login"
            className="w-full py-[15px]"
          >
            Log in
          </ConsolePrimaryLink>
        </section>
      </main>
    </div>
  );
}
