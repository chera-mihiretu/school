"use server";

import { revalidatePath } from "next/cache";
import type { AdminApiError } from "./admin-api";
import { readIncomingHost } from "./host";
import { readSessionToken } from "./session";
import {
  createAdminTenant,
  reactivateAdminTenant,
  resendAdminTenantCredentials,
  suspendAdminTenant,
  type CreatedTenant,
  type CreatedTenantResult,
} from "./tenants-api";
import {
  DIRECTOR_EMAIL_UNAVAILABLE,
  validateDirectorEmail,
  type TenantSchool,
} from "./tenants";

export type CreateSchoolActionResult =
  | {
      ok: true;
      school: CreatedTenant;
      credentials: CreatedTenantResult["credentials"];
      emailSent: boolean;
      emailError?: string;
    }
  | { ok: false; error: string };

function isErrorResult(
  value: CreatedTenant | CreatedTenantResult | AdminApiError,
): value is AdminApiError {
  return (
    "error" in value &&
    "status" in value &&
    !("id" in value) &&
    !("school" in value)
  );
}

export async function createSchoolAction(
  name: string,
  email: string,
): Promise<CreateSchoolActionResult> {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (trimmedName.length === 0) {
    return { ok: false, error: "A school name is required." };
  }
  const invalidEmail = validateDirectorEmail(trimmedEmail);
  if (invalidEmail !== undefined) {
    return { ok: false, error: invalidEmail };
  }

  const token = await readSessionToken();
  if (token === undefined) {
    return { ok: false, error: "Sign in to create a school" };
  }

  const created = await createAdminTenant({
    token,
    host: await readIncomingHost(),
    name: trimmedName,
    email: trimmedEmail,
  });

  if (isErrorResult(created)) {
    if (created.status === 409) {
      return { ok: false, error: DIRECTOR_EMAIL_UNAVAILABLE };
    }
    return { ok: false, error: created.error };
  }

  revalidatePath("/platform-admin/schools");
  return {
    ok: true,
    school: created.school,
    credentials: created.credentials,
    emailSent: created.emailSent,
    ...(created.emailError !== undefined ? { emailError: created.emailError } : {}),
  };
}

export type TenantStatusActionResult =
  | { ok: true; school: TenantSchool }
  | { ok: false; error: string };

async function requireAdminCall(): Promise<
  { token: string; host: string } | { error: string }
> {
  const token = await readSessionToken();
  if (token === undefined) {
    return { error: "Sign in to manage schools" };
  }

  return { token, host: await readIncomingHost() };
}

export async function suspendTenantAction(
  id: string,
): Promise<TenantStatusActionResult> {
  if (id.length === 0) {
    return { ok: false, error: "Missing school id" };
  }

  const auth = await requireAdminCall();
  if ("error" in auth) {
    return { ok: false, error: auth.error };
  }

  const updated = await suspendAdminTenant({ ...auth, id });
  if (isErrorResult(updated)) {
    return { ok: false, error: updated.error };
  }

  revalidatePath("/platform-admin/schools");
  return { ok: true, school: updated };
}

export async function reactivateTenantAction(
  id: string,
): Promise<TenantStatusActionResult> {
  if (id.length === 0) {
    return { ok: false, error: "Missing school id" };
  }

  const auth = await requireAdminCall();
  if ("error" in auth) {
    return { ok: false, error: auth.error };
  }

  const updated = await reactivateAdminTenant({ ...auth, id });
  if (isErrorResult(updated)) {
    return { ok: false, error: updated.error };
  }

  revalidatePath("/platform-admin/schools");
  return { ok: true, school: updated };
}

export async function resendTenantCredentialsAction(
  id: string,
): Promise<CreateSchoolActionResult> {
  if (id.length === 0) {
    return { ok: false, error: "Missing school id" };
  }

  const auth = await requireAdminCall();
  if ("error" in auth) {
    return { ok: false, error: auth.error };
  }

  const resent = await resendAdminTenantCredentials({ ...auth, id });
  if (isErrorResult(resent)) {
    return { ok: false, error: resent.error };
  }

  revalidatePath("/platform-admin/schools");
  return {
    ok: true,
    school: resent.school,
    credentials: resent.credentials,
    emailSent: resent.emailSent,
    ...(resent.emailError !== undefined ? { emailError: resent.emailError } : {}),
  };
}
