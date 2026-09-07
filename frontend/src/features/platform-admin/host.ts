import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isPlatformAdminHost } from "@/lib/host";

export async function readIncomingHost(): Promise<string> {
  const headerList = await headers();
  return headerList.get("x-school-host") ?? headerList.get("host") ?? "";
}

export async function requirePlatformAdminHost(): Promise<void> {
  const host = await readIncomingHost();
  if (!isPlatformAdminHost(host)) {
    notFound();
  }
}
