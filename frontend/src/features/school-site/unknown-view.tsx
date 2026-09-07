"use client";

import { NetworkMark } from "@/features/ui/network-mark";
import { networkHomeHref } from "./network-home";

export function UnknownView({
  host,
  rootHost,
}: {
  host: string;
  rootHost: string;
}) {
  return (
    <div
      data-surface="site"
      className="flex min-h-full items-center justify-center bg-site-canvas px-10 py-10 font-newsreader text-site-ink"
    >
      <div className="max-w-[520px]">
        <div className="mb-[34px] text-site-brick">
          <NetworkMark size={24} decorative />
        </div>
        <div className="mb-5 font-mono text-[12.5px] tracking-[0.04em] text-site-muted">
          {host}
        </div>
        <h1 className="mb-5 text-[clamp(30px,4.2vw,46px)] font-light leading-tight tracking-[-0.025em]">
          There is no school at this address.
        </h1>
        <p className="mb-[34px] max-w-[42ch] text-[17.5px] leading-[1.7] text-site-body">
          The address may be mistyped, or the school may never have been on this
          network. Nothing has gone wrong here.
        </p>
        <a href={networkHomeHref(rootHost)} className="font-bricolage text-sm text-site-brick">
          Go to {rootHost} →
        </a>
      </div>
    </div>
  );
}
