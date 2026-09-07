import type { Metadata } from "next";
import { requireCampusDirector } from "@/features/school-account/require-campus-director";
import { listSchoolTeachersAction } from "@/features/school-teachers/actions";
import { TeachersListView } from "@/features/school-teachers/teachers-list-view";

export async function generateMetadata(): Promise<Metadata> {
  const director = await requireCampusDirector();
  return {
    title: `Teachers · ${director.name}`,
    description: `Teachers at ${director.name}.`,
  };
}

export default async function CampusTeachersPage() {
  const director = await requireCampusDirector();
  const listed = await listSchoolTeachersAction();

  return (
    <TeachersListView
      schoolName={director.name}
      initialTeachers={listed.teachers}
      initialListError={listed.ok ? null : listed.error}
    />
  );
}
