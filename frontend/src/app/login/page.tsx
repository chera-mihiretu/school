import { redirect } from "next/navigation";
import { CampusLoginView } from "@/features/school-account/campus-login-view";
import { requireCampusHost } from "@/features/school-account/host";
import { getCampusAccountSession } from "@/features/school-account/session";

export default async function CampusLoginPage() {
  const campus = await requireCampusHost();
  const session = await getCampusAccountSession();

  if (session !== undefined) {
    switch (session.kind) {
      case "director":
        redirect("/dashboard");
      case "teacher":
      case "staff":
        break;
      default: {
        const _never: never = session.kind;
        return _never;
      }
    }
  }

  return (
    <CampusLoginView
      schoolName={campus.name}
      host={campus.host}
      initialSession={session ?? null}
    />
  );
}
