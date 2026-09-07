"use server";

import { readIncomingHost } from "@/features/school-account/host";
import { readSchoolAccountToken } from "@/features/school-account/session";
import type { CampusSessionView } from "@/features/school-account/school-account";
import {
  changeStaffPassword,
  createSchoolStaff,
  listSchoolStaff,
  resendSchoolStaffCredentials,
  type SchoolStaffApiError,
} from "./school-staff-api";
import {
  toCreateStaffInput,
  type CreatedStaffResult,
  type StaffAdminView,
  type StaffSex,
} from "./school-staff";

function isApiError(
  value: CreatedStaffResult | CampusSessionView | SchoolStaffApiError,
): value is SchoolStaffApiError {
  return "error" in value && "status" in value && !("staff" in value) && !("accountId" in value);
}

async function requireCampusCall(): Promise<
  { token: string; host: string } | { error: string }
> {
  const token = await readSchoolAccountToken();
  if (token === undefined) {
    return { error: "Sign in to continue" };
  }

  return { token, host: await readIncomingHost() };
}

export type ListStaffActionResult =
  | { ok: true; staff: StaffAdminView[] }
  | { ok: false; error: string; staff: StaffAdminView[] };

export async function listSchoolStaffAction(): Promise<ListStaffActionResult> {
  const auth = await requireCampusCall();
  if ("error" in auth) {
    return { ok: false, error: auth.error, staff: [] };
  }

  const listed = await listSchoolStaff(auth);
  if (listed.error !== null) {
    return { ok: false, error: listed.error, staff: listed.staff };
  }

  return { ok: true, staff: listed.staff };
}

export type CreateStaffActionResult =
  | { ok: true } & CreatedStaffResult
  | { ok: false; error: string };

export async function createSchoolStaffAction(input: {
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  sex: StaffSex | "";
  phone: string;
  email: string;
}): Promise<CreateStaffActionResult> {
  if (input.sex === "") {
    return { ok: false, error: "Sex is required." };
  }

  const prepared = toCreateStaffInput({ ...input, sex: input.sex });
  if ("error" in prepared) {
    return { ok: false, error: prepared.error };
  }

  const auth = await requireCampusCall();
  if ("error" in auth) {
    return { ok: false, error: auth.error };
  }

  const created = await createSchoolStaff({
    ...auth,
    staff: prepared,
  });

  if (isApiError(created)) {
    return { ok: false, error: created.error };
  }

  return { ok: true, ...created };
}

export async function resendSchoolStaffCredentialsAction(
  id: string,
): Promise<CreateStaffActionResult> {
  if (id.trim().length === 0) {
    return { ok: false, error: "Missing staff id" };
  }

  const auth = await requireCampusCall();
  if ("error" in auth) {
    return { ok: false, error: auth.error };
  }

  const resent = await resendSchoolStaffCredentials({ ...auth, id });
  if (isApiError(resent)) {
    return { ok: false, error: resent.error };
  }

  return { ok: true, ...resent };
}

export type ChangeStaffPasswordActionResult =
  | { ok: true; session: CampusSessionView }
  | { ok: false; error: string };

export async function changeStaffPasswordAction(
  password: string,
): Promise<ChangeStaffPasswordActionResult> {
  if (password.length < 12) {
    return { ok: false, error: "Password must be at least 12 characters." };
  }

  const auth = await requireCampusCall();
  if ("error" in auth) {
    return { ok: false, error: auth.error };
  }

  const result = await changeStaffPassword({
    ...auth,
    password,
  });

  if (isApiError(result)) {
    return { ok: false, error: result.error };
  }

  return { ok: true, session: result };
}
