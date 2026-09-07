import { redirect } from "next/navigation";
import { listAdminFeaturedSchools } from "@/features/platform-admin/featured-schools-api";
import { FeaturedSchoolsView } from "@/features/platform-admin/featured-schools-view";
import { readIncomingHost } from "@/features/platform-admin/host";
import {
  getPlatformAdminIdentity,
  readSessionToken,
} from "@/features/platform-admin/session";
import { getRootHost } from "@/lib/host";

export default async function PlatformAdminFeaturedPage() {
  const session = await getPlatformAdminIdentity();
  if (session === undefined) {
    redirect("/platform-admin/login");
  }

  const token = await readSessionToken();
  const listed =
    token === undefined
      ? { schools: [], error: "Sign in to manage featured schools" }
      : await listAdminFeaturedSchools({
          token,
          host: await readIncomingHost(),
        });

  return (
    <FeaturedSchoolsView
      rootHost={getRootHost()}
      initialSchools={listed.schools}
      initialError={listed.error}
    />
  );
}
