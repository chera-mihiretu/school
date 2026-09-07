import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireCampusHost } from "@/features/school-account/host";
import { NetworkLockup, NetworkMark } from "@/features/ui/network-mark";
import { publicUrl } from "@/lib/public-url";

export const metadata: Metadata = {
  title: "Campus login",
  description: "Sign in on your school host.",
};

export default async function CampusLoginLayout({
  children,
}: {
  children: ReactNode;
}) {
  const campus = await requireCampusHost();

  return (
    <div
      data-surface="site"
      className="flex min-h-full flex-col bg-site-canvas font-newsreader text-site-ink antialiased"
    >
      <header className="flex items-center gap-5 border-b border-site-line px-6 py-[22px] sm:px-10">
        <a href="/" className="flex min-w-0 items-center gap-3 text-site-brick no-underline">
          <NetworkMark size={22} decorative />
          <div className="flex min-w-0 items-baseline gap-px font-mono text-[13px] tracking-[0.02em]">
            <span className="font-medium text-site-brick">{campus.slug}</span>
            <span className="truncate text-site-muted">.{campus.rootHost}</span>
          </div>
        </a>
        <div className="flex-1" />
        <NetworkLockup
          href={publicUrl()}
          className="hidden text-site-brick sm:inline-flex"
          markSize={22}
        />
        <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-site-muted">
          {campus.name}
        </div>
      </header>
      {children}
    </div>
  );
}
