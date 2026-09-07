import type { Metadata } from "next";
import { requireCampusDirector } from "@/features/school-account/require-campus-director";
import { CreateStaffView } from "@/features/school-staff/create-staff-view";

export async function generateMetadata(): Promise<Metadata> {
  const director = await requireCampusDirector();
  return {
    title: `Add a staff member · ${director.name}`,
    description: `Add a staff member at ${director.name}.`,
  };
}

export default async function CampusAddStaffPage() {
  const director = await requireCampusDirector();

  return <CreateStaffView schoolName={director.name} />;
}
