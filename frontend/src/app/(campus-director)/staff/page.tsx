import type { Metadata } from "next";
import { requireCampusDirector } from "@/features/school-account/require-campus-director";
import { listSchoolStaffAction } from "@/features/school-staff/actions";
import { StaffListView } from "@/features/school-staff/staff-list-view";

export async function generateMetadata(): Promise<Metadata> {
  const director = await requireCampusDirector();
  return {
    title: `Staff · ${director.name}`,
    description: `Staff at ${director.name}.`,
  };
}

export default async function CampusStaffPage() {
  const director = await requireCampusDirector();
  const listed = await listSchoolStaffAction();

  return (
    <StaffListView
      schoolName={director.name}
      initialStaff={listed.staff}
      initialListError={listed.ok ? null : listed.error}
    />
  );
}
