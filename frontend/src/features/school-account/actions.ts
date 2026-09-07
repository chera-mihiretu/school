"use server";

import { redirect } from "next/navigation";
import { slugifySchoolName } from "@/lib/network";
import { publicUrl } from "@/lib/public-url";
import { readIncomingHost } from "./host";
import {
  changeSchoolAccountPassword,
  claimSchoolAccountAbbreviation,
  claimSchoolAccountUsername,
  claimSchoolSettingsAbbreviation,
  createCampusAccountSession,
  createSchoolAccountSession,
  deleteSchoolAccountSession,
  lookupSchoolAccountUsername,
  readSchoolAccountAbbreviation,
  readSchoolSettingsAbbreviation,
  type SchoolAccountApiError,
} from "./school-account-api";
import type {
  CampusSessionView,
  ClaimUsernameView,
  SchoolSessionView,
  SchoolSignInView,
  UsernameLookup,
} from "./school-account";
import type {
  AbbreviationPreview,
  ClaimedAbbreviation,
} from "./school-abbreviation";
import {
  clearSchoolAccountCookie,
  readSchoolAccountToken,
  setSchoolAccountCookie,
} from "./session";

export type SchoolAccountActionResult =
  | { ok: true; session: SchoolSessionView }
  | { ok: false; error: string };

function isApiError(
  value:
    | SchoolSignInView
    | SchoolSessionView
    | CampusSessionView
    | ClaimUsernameView
    | UsernameLookup
    | AbbreviationPreview
    | ClaimedAbbreviation
    | { abbreviation: string; locked: true }
    | SchoolAccountApiError,
): value is SchoolAccountApiError {
  return "error" in value && "status" in value;
}

export async function signInSchoolAccountAction(
  email: string,
  password: string,
): Promise<SchoolAccountActionResult> {
  const trimmedEmail = email.trim();
  if (trimmedEmail.length === 0 || password.length === 0) {
    return { ok: false, error: "Email and password are required" };
  }

  try {
    const result = await createSchoolAccountSession({
      email: trimmedEmail,
      password,
      host: await readIncomingHost(),
    });

    if (isApiError(result)) {
      return { ok: false, error: result.error };
    }

    await setSchoolAccountCookie({
      token: result.token,
      expiresAt: result.expiresAt,
    });

    return { ok: true, session: result };
  } catch {
    return { ok: false, error: "Could not reach the sign-in service" };
  }
}

export async function changeSchoolAccountPasswordAction(
  currentPassword: string,
  newPassword: string,
): Promise<SchoolAccountActionResult> {
  if (currentPassword.length === 0 || newPassword.length === 0) {
    return { ok: false, error: "Current and new passwords are required" };
  }

  const token = await readSchoolAccountToken();
  if (token === undefined) {
    return { ok: false, error: "Sign in to change your password" };
  }

  try {
    const result = await changeSchoolAccountPassword({
      token,
      host: await readIncomingHost(),
      currentPassword,
      newPassword,
    });

    if (isApiError(result)) {
      return { ok: false, error: result.error };
    }

    return { ok: true, session: result };
  } catch {
    return { ok: false, error: "Could not reach the password service" };
  }
}

export type LookupSchoolUsernameResult =
  | { ok: true; lookup: UsernameLookup }
  | { ok: false; error: string };

export async function lookupSchoolUsernameAction(
  slug: string,
): Promise<LookupSchoolUsernameResult> {
  const normalized = slugifySchoolName(slug);
  if (normalized.length === 0) {
    return {
      ok: true,
      lookup: { available: false, username: "", reason: "invalid" },
    };
  }

  const token = await readSchoolAccountToken();
  if (token === undefined) {
    return { ok: false, error: "Sign in to check a username" };
  }

  try {
    const lookedUp = await lookupSchoolAccountUsername({
      token,
      host: await readIncomingHost(),
      slug: normalized,
    });

    if (isApiError(lookedUp)) {
      return { ok: false, error: lookedUp.error };
    }

    return { ok: true, lookup: lookedUp };
  } catch {
    return { ok: false, error: "Could not reach the username service" };
  }
}

export type ClaimUsernameActionResult =
  | { ok: true; nextPath: "/first-login/abbreviation" }
  | { ok: false; error: string };

export async function claimSchoolUsernameAction(
  slug: string,
  understoodPermanent: boolean,
): Promise<ClaimUsernameActionResult> {
  const normalized = slugifySchoolName(slug);
  if (normalized.length === 0) {
    return { ok: false, error: "A username is required" };
  }
  if (!understoodPermanent) {
    return {
      ok: false,
      error: "Confirm that this address cannot be changed",
    };
  }

  const token = await readSchoolAccountToken();
  if (token === undefined) {
    return { ok: false, error: "Sign in to claim a username" };
  }

  const host = await readIncomingHost();

  try {
    const result = await claimSchoolAccountUsername({
      token,
      host,
      slug: normalized,
    });

    if (isApiError(result)) {
      return { ok: false, error: result.error };
    }

    return { ok: true, nextPath: "/first-login/abbreviation" };
  } catch {
    return { ok: false, error: "Could not reach the username service" };
  }
}

export type ReadAbbreviationActionResult =
  | { ok: true; preview: AbbreviationPreview }
  | { ok: false; error: string };

async function requireSchoolToken(): Promise<
  { token: string; host: string } | { error: string }
> {
  const token = await readSchoolAccountToken();
  if (token === undefined) {
    return { error: "Sign in to continue" };
  }
  return { token, host: await readIncomingHost() };
}

export async function readAppAbbreviationAction(
  code?: string,
): Promise<ReadAbbreviationActionResult> {
  const auth = await requireSchoolToken();
  if ("error" in auth) {
    return { ok: false, error: auth.error };
  }

  try {
    const result = await readSchoolAccountAbbreviation({
      ...auth,
      ...(code !== undefined ? { code } : {}),
    });
    if (isApiError(result)) {
      return { ok: false, error: result.error };
    }
    return { ok: true, preview: result };
  } catch {
    return { ok: false, error: "Could not reach the abbreviation service" };
  }
}

export type ClaimAbbreviationActionResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; error: string };

export async function claimAppAbbreviationAction(
  abbreviation: string,
  understoodPermanent: boolean,
): Promise<ClaimAbbreviationActionResult> {
  if (!understoodPermanent) {
    return {
      ok: false,
      error: "Confirm that this abbreviation cannot be changed",
    };
  }

  const auth = await requireSchoolToken();
  if ("error" in auth) {
    return { ok: false, error: auth.error };
  }

  try {
    const result = await claimSchoolAccountAbbreviation({
      ...auth,
      abbreviation,
    });
    if (isApiError(result)) {
      return { ok: false, error: result.error };
    }

    try {
      await deleteSchoolAccountSession(auth);
    } catch {
      // Cookie clear still signs the browser out of app.
    }
    await clearSchoolAccountCookie();
    return { ok: true, redirectUrl: publicUrl({ label: result.slug }) };
  } catch {
    return { ok: false, error: "Could not reach the abbreviation service" };
  }
}

export async function readSettingsAbbreviationAction(
  code?: string,
): Promise<ReadAbbreviationActionResult> {
  const auth = await requireSchoolToken();
  if ("error" in auth) {
    return { ok: false, error: auth.error };
  }

  try {
    const result = await readSchoolSettingsAbbreviation({
      ...auth,
      ...(code !== undefined ? { code } : {}),
    });
    if (isApiError(result)) {
      return { ok: false, error: result.error };
    }
    return { ok: true, preview: result };
  } catch {
    return { ok: false, error: "Could not reach the abbreviation service" };
  }
}

export type ClaimSettingsAbbreviationActionResult =
  | { ok: true; preview: AbbreviationPreview }
  | { ok: false; error: string };

export async function claimSettingsAbbreviationAction(
  abbreviation: string,
  understoodPermanent: boolean,
): Promise<ClaimSettingsAbbreviationActionResult> {
  if (!understoodPermanent) {
    return {
      ok: false,
      error: "Confirm that this abbreviation cannot be changed",
    };
  }

  const auth = await requireSchoolToken();
  if ("error" in auth) {
    return { ok: false, error: auth.error };
  }

  try {
    const claimed = await claimSchoolSettingsAbbreviation({
      ...auth,
      abbreviation,
    });
    if (isApiError(claimed)) {
      return { ok: false, error: claimed.error };
    }
    const previewed = await readSchoolSettingsAbbreviation(auth);
    if (isApiError(previewed)) {
      return {
        ok: true,
        preview: {
          abbreviation: claimed.abbreviation,
          locked: true,
          suggested: claimed.abbreviation,
          examples: null,
        },
      };
    }
    return { ok: true, preview: previewed };
  } catch {
    return { ok: false, error: "Could not reach the abbreviation service" };
  }
}

export type CampusSignInActionResult =
  | { ok: true; session: CampusSessionView }
  | { ok: false; error: string };

export async function signInCampusAccountAction(
  identifier: string,
  password: string,
): Promise<CampusSignInActionResult> {
  const trimmed = identifier.trim();
  if (trimmed.length === 0 || password.length === 0) {
    return { ok: false, error: "Email or school ID and password are required" };
  }

  try {
    const result = await createCampusAccountSession({
      identifier: trimmed,
      password,
      host: await readIncomingHost(),
    });

    if (isApiError(result)) {
      return { ok: false, error: result.error };
    }

    await setSchoolAccountCookie({
      token: result.token,
      expiresAt: result.expiresAt,
    });

    return { ok: true, session: result };
  } catch {
    return { ok: false, error: "Could not reach the sign-in service" };
  }
}

export async function signOutSchoolAccountAction(): Promise<void> {
  const token = await readSchoolAccountToken();
  const host = await readIncomingHost();

  if (token !== undefined) {
    try {
      await deleteSchoolAccountSession({ token, host });
    } catch {
      // Cookie clear still signs the browser out.
    }
  }

  await clearSchoolAccountCookie();
  redirect("/");
}
