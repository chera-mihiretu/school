import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { fetchPublicHostView } from "@/features/school-site/public-host-api";
import { parseSchoolHost } from "@/lib/host";
import { resolvePublicSchoolView } from "@/lib/network";

export async function GET() {
  const headerList = await headers();
  const hostHeader =
    headerList.get("x-school-host") ?? headerList.get("host") ?? "";
  const parsed = parseSchoolHost(hostHeader);
  const remote = await fetchPublicHostView(parsed.hostname);
  return NextResponse.json(remote ?? resolvePublicSchoolView(parsed));
}
