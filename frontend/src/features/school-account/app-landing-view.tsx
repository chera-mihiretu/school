import { NetworkMark } from "@/features/ui/network-mark";
import { FirstLoginPrimaryLink } from "./first-login-ui";

export function AppLandingView({
  host,
  rootHost,
}: {
  host: string;
  rootHost: string;
}) {
  return (
    <div
      data-surface="site"
      className="flex min-h-full flex-col bg-site-canvas font-newsreader text-site-ink antialiased"
    >
      <header className="flex items-center gap-5 border-b border-site-line px-6 py-[26px] sm:px-10">
        <div className="flex min-w-0 items-center gap-3 text-site-brick">
          <NetworkMark size={22} decorative />
          <div className="flex min-w-0 items-baseline gap-px font-mono text-[13px] tracking-[0.02em]">
            <span className="font-medium text-site-brick">app</span>
            <span className="truncate text-site-muted">.{rootHost}</span>
          </div>
        </div>
        <div className="flex-1" />
        <FirstLoginPrimaryLink href="/first-login" className="px-4 py-2">
          Log in
        </FirstLoginPrimaryLink>
      </header>

      <main className="flex flex-1 justify-center px-6 pb-12 pt-[12vh] sm:px-10">
        <section className="w-full max-w-[440px]">
          <div className="mb-[22px] font-mono text-[10px] tracking-[0.16em] uppercase text-site-brick">
            School account
          </div>
          <h1 className="mb-4 text-[clamp(36px,5vw,56px)] font-light leading-[1.05] tracking-[-0.03em]">
            Your school starts here.
          </h1>
          <p className="mb-10 max-w-[36ch] text-[17.5px] leading-[1.65] text-site-body">
            Directors sign in with the email and temporary password we sent.
            This host is for first login, not a campus site.
          </p>
          <p className="mb-10 font-mono text-[12px] tracking-[0.04em] text-site-muted">
            {host}
          </p>
          <FirstLoginPrimaryLink href="/first-login" className="w-full py-[15px]">
            Log in
          </FirstLoginPrimaryLink>
        </section>
      </main>
    </div>
  );
}
