import type { Metadata } from "next";
import { requireCampusDirector } from "@/features/school-account/require-campus-director";
import { CreateTeacherView } from "@/features/school-teachers/create-teacher-view";

export async function generateMetadata(): Promise<Metadata> {
  const director = await requireCampusDirector();
  return {
    title: `Add a teacher · ${director.name}`,
    description: `Add a teacher at ${director.name}.`,
  };
}

export default async function CampusAddTeacherPage() {
  const director = await requireCampusDirector();

  return <CreateTeacherView schoolName={director.name} />;
}
