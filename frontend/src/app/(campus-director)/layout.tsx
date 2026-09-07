import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CampusDirectorShell } from "@/features/school-account/campus-director-shell";
import { requireCampusDirector } from "@/features/school-account/require-campus-director";

export const metadata: Metadata = {
  title: "Campus",
  description: "Director workspace for this school.",
};

export default async function CampusDirectorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const director = await requireCampusDirector();

  return (
    <CampusDirectorShell
      schoolName={director.name}
      slug={director.slug}
      rootHost={director.rootHost}
      email={director.session.email}
    >
      {children}
    </CampusDirectorShell>
  );
}
