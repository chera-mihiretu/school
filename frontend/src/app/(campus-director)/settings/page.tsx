import type { Metadata } from "next";
import { readSettingsAbbreviationAction } from "@/features/school-account/actions";
import { requireCampusDirector } from "@/features/school-account/require-campus-director";
import { SchoolSettingsView } from "@/features/school-account/school-settings-view";

export async function generateMetadata(): Promise<Metadata> {
  const director = await requireCampusDirector();
  return {
    title: `Settings · ${director.name}`,
    description: `School ID letters for ${director.name}.`,
  };
}

export default async function CampusSettingsPage() {
  await requireCampusDirector();
  const result = await readSettingsAbbreviationAction();

  return (
    <SchoolSettingsView
      initialPreview={result.ok ? result.preview : null}
      initialError={result.ok ? null : result.error}
    />
  );
}
