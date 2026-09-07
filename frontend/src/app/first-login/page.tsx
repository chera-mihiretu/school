import { redirect } from "next/navigation";
import { FirstLoginView } from "@/features/school-account/first-login-view";
import { getSchoolAccountSession } from "@/features/school-account/session";

function readEmail(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined) {
    return "";
  }
  return raw.trim();
}

export default async function FirstLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[] }>;
}) {
  const params = await searchParams;
  const session = await getSchoolAccountSession();
  if (session?.nextStep === "username") {
    redirect("/first-login/username");
  }
  if (session?.nextStep === "abbreviation") {
    redirect("/first-login/abbreviation");
  }

  return (
    <FirstLoginView
      initialEmail={readEmail(params.email)}
      initialSession={session ?? null}
    />
  );
}
