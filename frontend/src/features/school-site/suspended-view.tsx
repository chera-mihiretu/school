"use client";

import { NetworkCredit } from "@/features/ui/network-mark";
import { networkHomeHref } from "./network-home";

export function SuspendedView({
  name,
  host,
  monogram,
  rootHost,
}: {
  name: string;
  host: string;
  monogram: string;
  rootHost: string;
}) {
  return (
    <div
      data-surface="site"
      className="flex min-h-full items-center justify-center bg-site-canvas px-10 py-10 font-newsreader text-site-ink"
    >
      <div className="max-w-[560px]">
        <div className="mb-[34px] flex items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center bg-site-muted font-bricolage text-[15px] font-bold text-site-canvas">
            {monogram}
          </div>
          <div className="font-bricolage text-[19px] font-medium tracking-[-0.02em] text-site-muted">
            {name}
          </div>
        </div>
        <h1 className="mb-5 max-w-[22ch] text-[clamp(28px,4vw,42px)] font-light leading-[1.12] tracking-[-0.025em]">
          This campus site is unavailable right now.
        </h1>
        <p className="mb-[26px] max-w-[46ch] text-[17.5px] leading-[1.7] text-site-body">
          The school&apos;s pages and sign-ins are paused. Records, enrolments and
          staff accounts are all kept and will return with the site.
        </p>
        <div className="max-w-[46ch] border-t border-site-line pt-[22px] text-base leading-[1.75] text-site-body">
          Families and staff: please contact the school office directly. General
          enquiries about the network go to{" "}
          <a href={networkHomeHref(rootHost)} className="text-site-brick">
            {rootHost}
          </a>
          .
        </div>
        <div className="mt-[30px] font-mono text-[11.5px] text-site-muted">
          {host} · paused by the platform operator
        </div>
        <NetworkCredit className="mt-8 text-site-muted" />
      </div>
    </div>
  );
}
