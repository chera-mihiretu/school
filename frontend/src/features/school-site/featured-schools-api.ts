import "server-only";
import {
  parseFeaturedSchools,
  type FeaturedSchool,
} from "./featured-schools";

function backendUrl(): string {
  return process.env.BACKEND_URL ?? "http://127.0.0.1:5000";
}

export async function listPublicFeaturedSchools(): Promise<FeaturedSchool[]> {
  try {
    const response = await fetch(`${backendUrl()}/public/featured-schools`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    return parseFeaturedSchools(await response.json());
  } catch {
    return [];
  }
}
