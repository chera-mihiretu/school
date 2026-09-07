import { NextResponse } from "next/server";
import { listPublicFeaturedSchools } from "@/features/school-site/featured-schools-api";

export async function GET() {
  const schools = await listPublicFeaturedSchools();
  return NextResponse.json({ schools });
}
