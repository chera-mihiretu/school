import { redirect } from "next/navigation";
import { requireCampusHost } from "./host";
import {
  isCampusDirectorSession,
  type CampusSessionView,
} from "./school-account";
import { getCampusAccountSession } from "./session";

export async function requireCampusDirector(): Promise<{
  name: string;
  slug: string;
  host: string;
  rootHost: string;
  session: CampusSessionView;
}> {
  const campus = await requireCampusHost();
  const session = await getCampusAccountSession();
  if (!isCampusDirectorSession(session)) {
    redirect("/login");
  }

  return { ...campus, session };
}
