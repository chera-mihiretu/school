"use server";

import { revalidatePath } from "next/cache";
import { isReservedSlug } from "@/lib/host";
import { isValidSchoolSlug, slugifySchoolName } from "@/lib/network";
import type { FeaturedSchool } from "@/features/school-site/featured-schools";
import {
  createAdminFeaturedSchool,
  deleteAdminFeaturedSchool,
  listAdminFeaturedSchools,
} from "./featured-schools-api";
import { readIncomingHost } from "./host";
import { readSessionToken } from "./session";

export type FeaturedSchoolsActionResult =
  | { ok: true; schools: FeaturedSchool[] }
  | { ok: false; error: string };

function isErrorResult(
  value: FeaturedSchool | { status: number; error: string },
): value is { status: number; error: string } {
  return "error" in value && "status" in value && !("slug" in value);
}

async function requireAdminCall(): Promise<
  { token: string; host: string } | { error: string }
> {
  const token = await readSessionToken();
  if (token === undefined) {
    return { error: "Sign in to manage featured schools" };
  }

  return { token, host: await readIncomingHost() };
}

async function refreshList(
  auth: { token: string; host: string },
): Promise<FeaturedSchoolsActionResult> {
  const listed = await listAdminFeaturedSchools(auth);
  if (listed.error !== null) {
    return { ok: false, error: listed.error };
  }
  revalidatePath("/");
  revalidatePath("/platform-admin/featured");
  return { ok: true, schools: listed.schools };
}

export async function addFeaturedSchoolAction(
  name: string,
  slug: string,
): Promise<FeaturedSchoolsActionResult> {
  const trimmedName = name.trim();
  const normalizedSlug = slugifySchoolName(slug);

  if (trimmedName.length === 0) {
    return { ok: false, error: "A school name is required." };
  }
  if (normalizedSlug.length === 0) {
    return { ok: false, error: "A subdomain slug is required." };
  }
  if (!isValidSchoolSlug(normalizedSlug)) {
    return {
      ok: false,
      error:
        "Invalid slug: use lowercase letters, numbers and single hyphens, starting and ending with a letter or number.",
    };
  }
  if (isReservedSlug(normalizedSlug)) {
    return {
      ok: false,
      error: `“${normalizedSlug}” is reserved by the platform and can never name a school.`,
    };
  }

  const auth = await requireAdminCall();
  if ("error" in auth) {
    return { ok: false, error: auth.error };
  }

  const created = await createAdminFeaturedSchool({
    ...auth,
    name: trimmedName,
    slug: normalizedSlug,
  });

  if (isErrorResult(created)) {
    return { ok: false, error: created.error };
  }

  return refreshList(auth);
}

export async function removeFeaturedSchoolAction(
  id: string,
): Promise<FeaturedSchoolsActionResult> {
  if (id.length === 0) {
    return { ok: false, error: "Missing school id" };
  }

  const auth = await requireAdminCall();
  if ("error" in auth) {
    return { ok: false, error: auth.error };
  }

  const removed = await deleteAdminFeaturedSchool({ ...auth, id });
  if (removed !== undefined) {
    return { ok: false, error: removed.error };
  }

  return refreshList(auth);
}
