import type { Metadata } from "next";
import type { ReactNode } from "react";
import { FirstLoginSecretsGuard } from "@/features/school-account/first-login-secrets-guard";
import { requireAppHost } from "@/features/school-account/host";
import { NetworkMark } from "@/features/ui/network-mark";
import { getRootHost } from "@/lib/host";

export const metadata: Metadata = {
  title: "First login",
  description: "Sign in to your school account and choose a password.",
};

export default async function FirstLoginLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAppHost();
  const rootHost = getRootHost();

  return (
    <div
      data-surface="site"
      className="flex min-h-full flex-col bg-site-canvas font-newsreader text-site-ink antialiased"
    >
      <header className="flex items-center gap-5 border-b border-site-line px-6 py-[22px] sm:px-10">
        <a href="/" className="flex min-w-0 items-center gap-3 text-site-brick no-underline">
          <NetworkMark size={22} decorative />
          <div className="flex min-w-0 items-baseline gap-px font-mono text-[13px] tracking-[0.02em]">
            <span className="font-medium text-site-brick">app</span>
            <span className="truncate text-site-muted">.{rootHost}</span>
          </div>
        </a>
        <div className="flex-1" />
        <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-site-muted">
          First login
        </div>
      </header>
      <FirstLoginSecretsGuard>{children}</FirstLoginSecretsGuard>
    </div>
  );
}
