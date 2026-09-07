import "server-only";
import {
  parseFeaturedSchool,
  parseFeaturedSchools,
  type FeaturedSchool,
} from "@/features/school-site/featured-schools";
import type { AdminApiError } from "./admin-api";

function backendUrl(): string {
  return process.env.BACKEND_URL ?? "http://127.0.0.1:5000";
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string" && body.error.length > 0) {
      return body.error;
    }
  } catch {
    // Use the status text below.
  }

  return response.statusText || "Request failed";
}

function adminHeaders(input: { token: string; host: string }): HeadersInit {
  return {
    authorization: `Bearer ${input.token}`,
    "x-school-host": input.host,
  };
}

export type FeaturedSchoolsList = {
  schools: FeaturedSchool[];
  error: string | null;
};

export async function listAdminFeaturedSchools(input: {
  token: string;
  host: string;
}): Promise<FeaturedSchoolsList> {
  try {
    const response = await fetch(`${backendUrl()}/admin/featured-schools`, {
      method: "GET",
      headers: adminHeaders(input),
      cache: "no-store",
    });

    if (!response.ok) {
      return { schools: [], error: await readError(response) };
    }

    return {
      schools: parseFeaturedSchools(await response.json()),
      error: null,
    };
  } catch {
    return { schools: [], error: "Could not reach the featured-schools service" };
  }
}

export async function createAdminFeaturedSchool(input: {
  token: string;
  host: string;
  name: string;
  slug: string;
}): Promise<FeaturedSchool | AdminApiError> {
  try {
    const response = await fetch(`${backendUrl()}/admin/featured-schools`, {
      method: "POST",
      headers: {
        ...adminHeaders(input),
        "content-type": "application/json",
      },
      body: JSON.stringify({ name: input.name, slug: input.slug }),
      cache: "no-store",
    });

    if (!response.ok) {
      return { status: response.status, error: await readError(response) };
    }

    const body: unknown = await response.json();
    const direct = parseFeaturedSchool(body);
    if (direct !== undefined) {
      return direct;
    }

    const wrapped =
      body !== null && typeof body === "object" && "school" in body
        ? parseFeaturedSchool((body as { school: unknown }).school)
        : undefined;
    if (wrapped !== undefined) {
      return wrapped;
    }

    const listed = parseFeaturedSchools(body);
    const match = listed.find((school) => school.slug === input.slug);
    if (match !== undefined) {
      return match;
    }

    return {
      id: "",
      name: input.name,
      slug: input.slug,
      created: "",
      host: "",
    };
  } catch {
    return { status: 503, error: "Could not reach the featured-schools service" };
  }
}

export async function deleteAdminFeaturedSchool(input: {
  token: string;
  host: string;
  id: string;
}): Promise<AdminApiError | undefined> {
  try {
    const response = await fetch(
      `${backendUrl()}/admin/featured-schools/${encodeURIComponent(input.id)}`,
      {
        method: "DELETE",
        headers: adminHeaders(input),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return { status: response.status, error: await readError(response) };
    }

    return undefined;
  } catch {
    return { status: 503, error: "Could not reach the featured-schools service" };
  }
}
