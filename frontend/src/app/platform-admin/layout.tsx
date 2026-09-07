import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ConsoleShell } from "@/features/platform-admin/console-shell";
import { getAdminDashboard } from "@/features/platform-admin/dashboard-api";
import {
  readIncomingHost,
  requirePlatformAdminHost,
} from "@/features/platform-admin/host";
import {
  getPlatformAdminIdentity,
  readSessionToken,
} from "@/features/platform-admin/session";
import { getRootHost } from "@/lib/host";

export const metadata: Metadata = {
  title: "Platform console",
  description: "Operator console for the school platform",
};

export default async function PlatformAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requirePlatformAdminHost();
  const session = await getPlatformAdminIdentity();
  const token = session === undefined ? undefined : await readSessionToken();
  const stats =
    token === undefined
      ? { activeCount: 0, suspendedCount: 0 }
      : await getAdminDashboard({
          token,
          host: await readIncomingHost(),
        });

  return (
    <ConsoleShell
      email={session?.email ?? null}
      rootHost={getRootHost()}
      activeCount={stats.activeCount}
      suspendedCount={stats.suspendedCount}
    >
      {children}
    </ConsoleShell>
  );
}
