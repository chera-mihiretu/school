import { redirect } from "next/navigation";
import { CreateSchoolView } from "@/features/platform-admin/create-school-view";
import { getPlatformAdminIdentity } from "@/features/platform-admin/session";
import { getRootHost } from "@/lib/host";

export default async function PlatformAdminCreateSchoolPage() {
  const session = await getPlatformAdminIdentity();
  if (session === undefined) {
    redirect("/platform-admin/login");
  }

  return <CreateSchoolView rootHost={getRootHost()} />;
}
