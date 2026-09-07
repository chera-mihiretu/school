import { redirect } from "next/navigation";
import { AbbreviationStepView } from "@/features/school-account/abbreviation-step-view";
import { getSchoolAccountSession } from "@/features/school-account/session";

export default async function FirstLoginAbbreviationPage() {
  const session = await getSchoolAccountSession();
  if (session === undefined || session.nextStep !== "abbreviation") {
    redirect("/first-login");
  }

  return <AbbreviationStepView initialSession={session} />;
}
