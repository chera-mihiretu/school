import { redirect } from "next/navigation";
import { UsernameStepView } from "@/features/school-account/username-step-view";
import { getSchoolAccountSession } from "@/features/school-account/session";
import { getRootHost } from "@/lib/host";

export default async function FirstLoginUsernamePage() {
  const session = await getSchoolAccountSession();
  if (session === undefined || session.nextStep !== "username") {
    redirect("/first-login");
  }

  return (
    <UsernameStepView initialSession={session} rootHost={getRootHost()} />
  );
}
