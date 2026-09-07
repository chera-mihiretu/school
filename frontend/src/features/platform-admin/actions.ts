"use server";

import { redirect } from "next/navigation";
import {
  createAdminSession,
  deleteAdminSession,
  type AdminApiError,
  type PlatformAdminSession,
} from "./admin-api";
import { readIncomingHost } from "./host";
import {
  clearPlatformAdminCookie,
  readSessionToken,
  setPlatformAdminCookie,
} from "./session";

export type SignInState = {
  error: string | null;
};

function isAdminApiError(
  value: PlatformAdminSession | AdminApiError,
): value is AdminApiError {
  return "error" in value && "status" in value && !("token" in value);
}

export async function signInPlatformAdmin(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (email.trim().length === 0 || password.length === 0) {
    return { error: "Email and password are required" };
  }

  try {
    const result = await createAdminSession({
      email,
      password,
      host: await readIncomingHost(),
    });

    if (isAdminApiError(result)) {
      return { error: result.error };
    }

    await setPlatformAdminCookie({
      token: result.token,
      expiresAt: result.expiresAt,
    });
  } catch {
    return { error: "Could not reach the sign-in service" };
  }

  redirect("/platform-admin");
}

export async function signOutPlatformAdmin(): Promise<void> {
  const token = await readSessionToken();
  const host = await readIncomingHost();

  if (token !== undefined) {
    try {
      await deleteAdminSession({ token, host });
    } catch {
      // Cookie clear still signs the browser out.
    }
  }

  await clearPlatformAdminCookie();
  redirect("/platform-admin/login");
}
