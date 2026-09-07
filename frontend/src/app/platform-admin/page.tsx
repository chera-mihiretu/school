import { redirect } from "next/navigation";
import { listAdminContactMessages } from "@/features/platform-admin/contact-messages-api";
import { EMPTY_ADMIN_DASHBOARD } from "@/features/platform-admin/dashboard";
import { getAdminDashboard } from "@/features/platform-admin/dashboard-api";
import { DashboardView } from "@/features/platform-admin/dashboard-view";
import { readIncomingHost } from "@/features/platform-admin/host";
import {
  getPlatformAdminIdentity,
  readSessionToken,
} from "@/features/platform-admin/session";
import { getRootHost } from "@/lib/host";

export default async function PlatformAdminHome() {
  const session = await getPlatformAdminIdentity();
  if (session === undefined) {
    redirect("/platform-admin/login");
  }

  const token = await readSessionToken();
  const host = await readIncomingHost();
  const listed =
    token === undefined
      ? { pending: 0 }
      : await listAdminContactMessages({
          token,
          host,
          page: 1,
          pageSize: 1,
        });
  const stats =
    token === undefined
      ? EMPTY_ADMIN_DASHBOARD
      : await getAdminDashboard({ token, host });

  return (
    <DashboardView
      rootHost={getRootHost()}
      pendingMessages={listed.pending}
      stats={stats}
    />
  );
}
