import { redirect } from "next/navigation";
import { SchoolsListView } from "@/features/platform-admin/schools-list-view";
import { readIncomingHost } from "@/features/platform-admin/host";
import {
  getPlatformAdminIdentity,
  readSessionToken,
} from "@/features/platform-admin/session";
import { listAdminTenants } from "@/features/platform-admin/tenants-api";
import { getRootHost } from "@/lib/host";

function readPage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

export default async function PlatformAdminSchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const session = await getPlatformAdminIdentity();
  if (session === undefined) {
    redirect("/platform-admin/login");
  }

  const params = await searchParams;
  const page = readPage(params.page);
  const token = await readSessionToken();
  const listed =
    token === undefined
      ? {
          schools: [],
          page,
          pageSize: 10,
          total: 0,
          error: "Sign in to manage schools",
        }
      : await listAdminTenants({
          token,
          host: await readIncomingHost(),
          page,
        });

  return (
    <SchoolsListView
      rootHost={getRootHost()}
      initialSchools={listed.schools}
      page={listed.page}
      pageSize={listed.pageSize}
      total={listed.total}
      initialError={listed.error}
    />
  );
}
