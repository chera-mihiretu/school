import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { fetchPublicHostView } from "@/features/school-site/public-host-api";
import { isAppHost, parseSchoolHost } from "@/lib/host";
import { resolvePublicSchoolView } from "@/lib/network";

export async function readIncomingHost(): Promise<string> {
  const headerList = await headers();
  return headerList.get("x-school-host") ?? headerList.get("host") ?? "";
}

export async function requireAppHost(): Promise<void> {
  const host = await readIncomingHost();
  if (!isAppHost(host)) {
    notFound();
  }
}

export async function requireCampusHost(): Promise<{
  name: string;
  slug: string;
  host: string;
  rootHost: string;
}> {
  const host = await readIncomingHost();
  const parsed = parseSchoolHost(host);
  const view =
    (await fetchPublicHostView(parsed.hostname)) ?? resolvePublicSchoolView(parsed);
  if (view.kind !== "campus") {
    notFound();
  }

  return {
    name: view.name,
    slug: view.slug,
    host: view.host,
    rootHost: view.rootHost,
  };
}
