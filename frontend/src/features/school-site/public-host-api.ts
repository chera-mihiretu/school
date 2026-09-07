import "server-only";
import {
  parsePublicSchoolView,
  type PublicSchoolView,
} from "@/lib/network";

function backendUrl(): string {
  return process.env.BACKEND_URL ?? "http://127.0.0.1:5000";
}

export async function fetchPublicHostView(
  hostHeader: string,
): Promise<PublicSchoolView | undefined> {
  try {
    const response = await fetch(`${backendUrl()}/public/resolve`, {
      method: "GET",
      cache: "no-store",
      headers: { "x-school-host": hostHeader },
    });

    if (!response.ok) {
      return undefined;
    }

    return parsePublicSchoolView(await response.json());
  } catch {
    return undefined;
  }
}
