import type { Metadata } from "next";
import { CampusDashboardView } from "@/features/school-account/campus-dashboard-view";
import { requireCampusDirector } from "@/features/school-account/require-campus-director";
import { listSchoolTeachersAction } from "@/features/school-teachers/actions";

export async function generateMetadata(): Promise<Metadata> {
  const director = await requireCampusDirector();
  return {
    title: director.name,
    description: `Director workspace for ${director.name}.`,
  };
}

export default async function CampusDashboardPage() {
  const director = await requireCampusDirector();
  const listed = await listSchoolTeachersAction();

  return (
    <CampusDashboardView
      schoolName={director.name}
      teacherCount={listed.ok ? listed.teachers.length : null}
      listError={listed.ok ? null : listed.error}
    />
  );
}
