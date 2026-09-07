"use client";

import { useEffect } from "react";
import { ContactForm } from "@/features/school-site/contact-form";
import { ContactPhone } from "@/features/school-site/contact-phone";
import {
  featuredSchoolHost,
  type FeaturedSchool,
} from "@/features/school-site/featured-schools";
import { MarkFilm } from "@/features/school-site/mark-film";
import { NetworkLockup } from "@/features/ui/network-mark";
import { useFeaturedSchoolsStore } from "@/stores/featured-schools-store";

const WHAT_WE_DO = [
  {
    kicker: "01",
    title: "A school on its own address",
    body: "Each campus lives at its own subdomain. Families go to that school, not to a shared marketplace.",
  },
  {
    kicker: "02",
    title: "Their site, their people",
    body: "The public face belongs to the school. Staff run it. We do not write their pages or sit in their classrooms.",
  },
  {
    kicker: "03",
    title: "One host above them",
    body: "We keep the platform, the addresses, and the operator console. A school can be opened, paused, or brought back without touching the others.",
  },
] as const;

const HOW_IT_STARTS = [
  {
    title: "Write to us",
    body: "Name, who you are, a work email. Conversation continues on email, not in a chat on this site.",
  },
  {
    title: "We send a link",
    body: "If we take the conversation forward, you receive a time-limited registration link to send documents.",
  },
  {
    title: "We send the account",
    body: "After we approve, we provision the school and email the login. Nobody creates a campus from a public form.",
  },
] as const;

export function ApexView({
  rootHost,
  schools: initialSchools,
}: {
  rootHost: string;
  schools: readonly FeaturedSchool[];
}) {
  const hydrate = useFeaturedSchoolsStore((state) => state.hydrate);
  const hydrated = useFeaturedSchoolsStore((state) => state.hydrated);
  const storeSchools = useFeaturedSchoolsStore((state) => state.schools);

  useEffect(() => {
    hydrate([...initialSchools]);
  }, [hydrate, initialSchools]);

  const schools = hydrated ? storeSchools : initialSchools;
  return (
    <div
      data-surface="site"
      className="flex min-h-full flex-col bg-site-apex font-newsreader text-site-apex-ink"
    >
      <header className="flex items-center gap-5 border-b border-site-apex-line px-6 py-[26px] sm:px-10">
        <NetworkLockup href="/" className="text-site-apex-ink" />
        <div className="flex-1" />
        <a
          href="#what-we-do"
          className="hidden font-mono text-[10px] tracking-[0.16em] uppercase text-site-apex-muted no-underline hover:text-site-apex-ink sm:inline"
        >
          What we do
        </a>
        <a
          href="#directory"
          className="hidden font-mono text-[10px] tracking-[0.16em] uppercase text-site-apex-muted no-underline hover:text-site-apex-ink sm:inline"
        >
          Schools
        </a>
        <a
          href="#contact"
          className="hidden font-mono text-[10px] tracking-[0.16em] uppercase text-site-apex-muted no-underline hover:text-site-apex-ink sm:inline"
        >
          Contact us
        </a>
        <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-site-apex-muted">
          Network home
        </div>
      </header>

      <section className="grid grid-cols-1 items-center gap-10 px-6 py-14 sm:px-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-14 lg:py-16">
        <div>
          <h1 className="mb-6 max-w-[16ch] text-[clamp(36px,5vw,64px)] font-light leading-[1.02] tracking-[-0.03em] text-pretty">
            Every school on its own address.
          </h1>
          <p className="mb-10 max-w-[46ch] text-[18px] leading-[1.65] text-site-apex-muted">
            One platform, many independent schools. Each campus gets a public
            face at its own subdomain, run by its own people. This page is the
            network, not a campus.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#what-we-do"
              className="bg-site-apex-button px-[26px] py-[15px] font-bricolage text-[13.5px] text-site-apex no-underline hover:opacity-90"
            >
              What we do
            </a>
            <a
              href="#contact"
              className="border border-site-apex-muted/50 px-[26px] py-[15px] font-bricolage text-[13.5px] text-site-apex-ink no-underline hover:border-site-apex-ink"
            >
              Contact us
            </a>
          </div>
        </div>
        <div className="min-w-0">
          <MarkFilm />
        </div>
      </section>

      <section
        id="what-we-do"
        className="border-t border-site-apex-line px-6 py-16 sm:px-10 sm:py-20"
      >
        <div className="mb-3 font-mono text-[10px] tracking-[0.16em] uppercase text-site-apex-muted">
          What we do
        </div>
        <h2 className="mb-12 max-w-[22ch] text-[clamp(28px,3.4vw,42px)] font-light leading-[1.12] tracking-[-0.03em]">
          We host schools. We do not become one.
        </h2>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
          {WHAT_WE_DO.map((item) => (
            <div key={item.kicker}>
              <div className="mb-4 font-mono text-[10px] tracking-[0.16em] uppercase text-site-apex-muted">
                {item.kicker}
              </div>
              <h3 className="mb-3 font-bricolage text-[18px] font-medium tracking-[-0.02em]">
                {item.title}
              </h3>
              <p className="m-0 max-w-[36ch] text-[16px] leading-[1.6] text-site-apex-muted">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-site-apex-line pt-12">
          <div className="mb-8 font-mono text-[10px] tracking-[0.16em] uppercase text-site-apex-muted">
            How a school joins
          </div>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
            {HOW_IT_STARTS.map((item, index) => (
              <div key={item.title}>
                <div className="mb-4 font-mono text-[10px] tracking-[0.16em] uppercase text-site-apex-muted">
                  0{index + 1}
                </div>
                <h3 className="mb-3 font-bricolage text-[18px] font-medium tracking-[-0.02em]">
                  {item.title}
                </h3>
                <p className="m-0 max-w-[36ch] text-[16px] leading-[1.6] text-site-apex-muted">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="directory"
        className="border-t border-site-apex-line px-6 py-12 sm:px-10"
      >
        <div className="mb-[18px] font-mono text-[10px] tracking-[0.16em] uppercase text-site-apex-muted">
          Schools on the network
        </div>
        <div className="border-t border-site-apex-line">
          {schools.map((school) => (
            <div
              key={school.id.length > 0 ? school.id : school.slug}
              className="flex items-baseline justify-between gap-5 border-b border-site-apex-line py-4"
            >
              <span className="font-bricolage text-[16.5px] tracking-[-0.01em]">
                {school.name}
              </span>
              <span className="font-mono text-[11.5px] text-site-apex-muted">
                {featuredSchoolHost(school, rootHost)}
              </span>
            </div>
          ))}
          {schools.length === 0 ? (
            <div className="grid grid-cols-1 gap-8 border-b border-site-apex-line py-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center">
              <div>
                <div className="mb-3 font-bricolage text-[18px] font-medium tracking-[-0.02em]">
                  Starting schools will list here.
                </div>
                <p className="m-0 max-w-[42ch] text-[16px] leading-[1.6] text-site-apex-muted">
                  Each campus gets its own address when we take it on. Until
                  the first schools are published, write to us — this directory
                  stays empty on purpose, not broken.
                </p>
              </div>
              <a
                href="#contact"
                className="font-mono text-[12.5px] text-site-apex-muted no-underline hover:text-site-apex-ink"
              >
                Contact us about a school →
              </a>
            </div>
          ) : null}
        </div>
      </section>

      <section
        id="contact"
        className="grid grid-cols-1 items-start gap-12 border-t border-site-apex-line px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-2 lg:gap-20"
      >
        <div>
          <div className="mb-3 font-mono text-[10px] tracking-[0.16em] uppercase text-site-apex-muted">
            Contact us
          </div>
          <h2 className="mb-5 max-w-[16ch] text-[clamp(28px,3.4vw,42px)] font-light leading-[1.12] tracking-[-0.03em]">
            Tell us about the school.
          </h2>
          <p className="mb-8 max-w-[44ch] text-[17px] leading-[1.65] text-site-apex-muted">
            We reply by email. This is a message to us, not an account. If we
            take the school on, the registration link and the login both arrive
            in that thread.
          </p>
          <ContactPhone />
        </div>
        <ContactForm rootHost={rootHost} />
      </section>

      <div className="flex items-center gap-3 border-t border-site-apex-line px-6 py-5 font-mono text-[10.5px] tracking-[0.08em] text-site-apex-muted sm:px-10">
        {rootHost} · operator console lives at admin.{rootHost}
      </div>
    </div>
  );
}
