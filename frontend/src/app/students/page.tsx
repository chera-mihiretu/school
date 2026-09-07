import { redirect } from "next/navigation";
import { requireCampusHost } from "@/features/school-account/host";

export default async function StudentsPage() {
  await requireCampusHost();
  redirect("/login");
}
