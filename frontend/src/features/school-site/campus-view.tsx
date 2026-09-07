import { MarkBuild } from "@/features/ui/mark-build";
import {
  NetworkCredit,
  NetworkLockup,
  NetworkMark,
} from "@/features/ui/network-mark";
import { publicUrl } from "@/lib/public-url";

const NAV_LINK =
  "font-mono text-[10px] tracking-[0.16em] uppercase text-site-muted no-underline hover:text-site-ink";

export function CampusView({
  name,
  host,
  rootHost,
  slug,
  founded,
  monogram,
}: {
  name: string;
  host: string;
  rootHost: string;
  slug: string;
  founded: string;
  monogram: string;
}) {
  const networkHref = publicUrl();
  const campusHost = `${slug}.${rootHost}`;

  return (
    <div
      data-surface="site"
      className="flex min-h-dvh flex-col bg-site-canvas font-newsreader text-site-ink antialiased"
    >
      <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-site-line bg-site-canvas/95 px-6 py-[18px] sm:gap-5 sm:px-10">
        <a
          href="/"
          className="flex min-w-0 items-center gap-3 text-site-ink no-underline"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-site-brick font-bricolage text-[13px] font-bold text-site-on-brick">
            {monogram}
          </span>
          <span className="truncate font-bricolage text-[17px] font-semibold tracking-[-0.03em]">
            {name}
          </span>
        </a>
        <nav
          className="hidden items-center gap-5 md:flex"
          aria-label="Campus"
        >
          <a href="#about" className={NAV_LINK}>
            About
          </a>
          <a href="#address" className={NAV_LINK}>
            This address
          </a>
          <a href="#staff" className={NAV_LINK}>
            Staff
          </a>
        </nav>
        <div className="flex-1" />
        <a
          href={networkHref}
          className="text-site-brick sm:hidden"
          aria-label="School network home"
        >
          <NetworkMark size={22} decorative />
        </a>
        <NetworkLockup
          href={networkHref}
          className="hidden text-site-brick sm:inline-flex"
          markSize={22}
        />
        <a
          href="/login"
          className="inline-flex items-center justify-center bg-site-brick px-4 py-2 font-bricolage text-[13px] text-site-on-brick no-underline hover:bg-site-brick-deep sm:px-5"
        >
          Log in
        </a>
      </header>

      <section className="grid grid-cols-1 items-center gap-10 px-6 py-14 sm:px-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:py-20">
        <div>
          <div className="mb-4 font-mono text-[10px] tracking-[0.16em] uppercase text-site-brick">
            Public campus
          </div>
          <h1 className="mb-5 max-w-[16ch] text-[clamp(36px,5.5vw,64px)] font-light leading-[1.05] tracking-[-0.03em] text-pretty">
            {name}
          </h1>
          <p className="mb-4 font-mono text-[12.5px] tracking-[0.04em] text-site-muted">
            {campusHost}
            <span className="text-site-line-strong"> · </span>
            {founded}
          </p>
          <p className="mb-10 max-w-[46ch] text-[18px] leading-[1.65] text-site-body">
            This is the public door for {name}. The campus is opening on its
            own address. Families come here; staff sign in to run the school.
            Notices, hours, and pages will appear as the school publishes them.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/login"
              className="inline-flex min-w-[148px] items-center justify-center bg-site-brick px-[26px] py-[15px] font-bricolage text-[13.5px] text-site-on-brick no-underline hover:bg-site-brick-deep"
            >
              Log in
            </a>
            <a
              href="#about"
              className="inline-flex items-center justify-center border border-site-line px-[26px] py-[14px] font-bricolage text-[13.5px] text-site-ink no-underline hover:border-site-brick"
            >
              About this campus
            </a>
          </div>
        </div>
        <div className="site-hatch flex min-h-[280px] items-center justify-center border border-site-line px-8 py-12 text-site-brick lg:min-h-[340px]">
          <div className="flex flex-col items-center gap-6 text-center">
            <MarkBuild size={96} />
            <p className="m-0 max-w-[28ch] font-bricolage text-[15px] tracking-[-0.02em] text-site-body">
              {name} on the School network
            </p>
          </div>
        </div>
      </section>

      <section
        id="about"
        className="border-t border-site-line px-6 py-16 sm:px-10 sm:py-20"
      >
        <div className="mb-3 font-mono text-[10px] tracking-[0.16em] uppercase text-site-muted">
          About
        </div>
        <h2 className="mb-8 max-w-[20ch] text-[clamp(28px,3.4vw,42px)] font-light leading-[1.12] tracking-[-0.03em]">
          A school with its own address.
        </h2>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
          <div>
            <h3 className="mb-3 font-bricolage text-[18px] font-medium tracking-[-0.02em]">
              This campus
            </h3>
            <p className="m-0 max-w-[36ch] text-[16px] leading-[1.6] text-site-body">
              {name} lives here, not on a shared marketplace. The name on the
              door is the school&apos;s. We host the address; the school runs
              what families see next.
            </p>
          </div>
          <div>
            <h3 className="mb-3 font-bricolage text-[18px] font-medium tracking-[-0.02em]">
              Just opening
            </h3>
            <p className="m-0 max-w-[36ch] text-[16px] leading-[1.6] text-site-body">
              Starting schools begin with this public face: identity, address,
              and a staff door. Timetables, news, and a custom site come when
              the school is ready — not as filler.
            </p>
          </div>
          <div>
            <h3 className="mb-3 font-bricolage text-[18px] font-medium tracking-[-0.02em]">
              For families
            </h3>
            <p className="m-0 max-w-[36ch] text-[16px] leading-[1.6] text-site-body">
              You are in the right place. Bookmark {campusHost}. If you need
              the office, contact the school directly; this page is not a
              parent portal yet.
            </p>
          </div>
        </div>
      </section>

      <section
        id="address"
        className="grid grid-cols-1 items-start gap-12 border-t border-site-line px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-2 lg:gap-20"
      >
        <div>
          <div className="mb-3 font-mono text-[10px] tracking-[0.16em] uppercase text-site-muted">
            This address
          </div>
          <h2 className="mb-5 max-w-[16ch] text-[clamp(28px,3.4vw,42px)] font-light leading-[1.12] tracking-[-0.03em]">
            {campusHost}
          </h2>
          <p className="m-0 max-w-[44ch] text-[17px] leading-[1.65] text-site-body">
            Share this host. It is the public name of {name} on {rootHost}.
            Other schools on the network keep their own doors.
          </p>
        </div>
        <div className="border border-site-line px-6 py-8">
          <NetworkCredit className="mb-5 text-site-muted" />
          <p className="m-0 mb-6 max-w-[40ch] text-[16px] leading-[1.6] text-site-body">
            Independent campuses, one host above them. The operator console is
            not this site.
          </p>
          <a
            href={networkHref}
            className="font-bricolage text-sm text-site-brick no-underline hover:text-site-brick-deep"
          >
            Go to {rootHost} →
          </a>
        </div>
      </section>

      <section
        id="staff"
        className="border-t border-site-line px-6 py-16 sm:px-10 sm:py-20"
      >
        <div className="mb-3 font-mono text-[10px] tracking-[0.16em] uppercase text-site-muted">
          Staff
        </div>
        <h2 className="mb-5 max-w-[18ch] text-[clamp(28px,3.4vw,42px)] font-light leading-[1.12] tracking-[-0.03em]">
          Directors and teachers sign in here.
        </h2>
        <p className="mb-8 max-w-[46ch] text-[17px] leading-[1.65] text-site-body">
          Campus tools live on this host. First-time directors start on the
          app host; after the username is claimed, every later sign-in is
          here. Teachers never use the app host.
        </p>
        <a
          href="/login"
          className="inline-flex min-w-[148px] items-center justify-center bg-site-brick px-[26px] py-[15px] font-bricolage text-[13.5px] text-site-on-brick no-underline hover:bg-site-brick-deep"
        >
          Log in
        </a>
      </section>

      <footer className="mt-auto flex flex-wrap items-center gap-3 border-t border-site-line px-6 py-5 font-mono text-[10.5px] tracking-[0.08em] text-site-muted sm:px-10">
        <span>
          {host} · {name}
        </span>
        <span className="flex-1" />
        <NetworkCredit />
      </footer>
    </div>
  );
}
