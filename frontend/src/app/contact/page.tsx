import type { Metadata } from "next";
import { headers } from "next/headers";
import { ContactForm } from "@/features/school-site/contact-form";
import { ContactPhone } from "@/features/school-site/contact-phone";
import { fetchPublicHostView } from "@/features/school-site/public-host-api";
import { UnknownView } from "@/features/school-site/unknown-view";
import { NetworkLockup } from "@/features/ui/network-mark";
import { parseSchoolHost } from "@/lib/host";
import { resolvePublicSchoolView, type PublicSchoolView } from "@/lib/network";

async function readSchoolHost() {
  const headerList = await headers();
  const hostHeader =
    headerList.get("x-school-host") ?? headerList.get("host") ?? "";
  return parseSchoolHost(hostHeader);
}

async function resolveIncomingView(): Promise<PublicSchoolView> {
  const parsed = await readSchoolHost();
  const remote = await fetchPublicHostView(parsed.hostname);
  return remote ?? resolvePublicSchoolView(parsed);
}

export async function generateMetadata(): Promise<Metadata> {
  const view = await resolveIncomingView();
  if (view.kind !== "apex") {
    return { title: "Contact" };
  }
  return {
    title: `Contact · ${view.rootHost}`,
    description: "Write to the School network operators.",
  };
}

export default async function ContactPage() {
  const view = await resolveIncomingView();
  if (view.kind !== "apex") {
    return <UnknownView host={view.host} rootHost={view.rootHost} />;
  }

  const rootHost = view.rootHost;

  return (
    <div
      data-surface="site"
      className="flex min-h-full flex-col bg-site-apex font-newsreader text-site-apex-ink"
    >
      <header className="flex items-center gap-5 border-b border-site-apex-line px-6 py-[26px] sm:px-10">
        <NetworkLockup href="/" className="text-site-apex-ink" />
        <div className="flex-1" />
        <a
          href="/#contact"
          className="font-mono text-[10px] tracking-[0.16em] uppercase text-site-apex-muted no-underline hover:text-site-apex-ink"
        >
          Contact us
        </a>
      </header>

      <section className="grid grid-cols-1 items-start gap-12 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-2 lg:gap-20">
        <div>
          <div className="mb-3 font-mono text-[10px] tracking-[0.16em] uppercase text-site-apex-muted">
            Contact us
          </div>
          <h1 className="mb-5 max-w-[16ch] text-[clamp(28px,3.4vw,42px)] font-light leading-[1.12] tracking-[-0.03em]">
            Tell us about the school.
          </h1>
          <p className="mb-8 max-w-[44ch] text-[17px] leading-[1.65] text-site-apex-muted">
            We reply by email. This is a message to us, not an account. If we
            take the school on, the registration link and the login both arrive
            in that thread.
          </p>
          <ContactPhone />
        </div>
        <ContactForm rootHost={rootHost} />
      </section>

      <div className="mt-auto flex items-center gap-3 border-t border-site-apex-line px-6 py-5 font-mono text-[10.5px] tracking-[0.08em] text-site-apex-muted sm:px-10">
        {rootHost} · operator console lives at admin.{rootHost}
      </div>
    </div>
  );
}
