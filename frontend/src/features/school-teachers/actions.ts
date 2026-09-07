"use server";

import { readIncomingHost } from "@/features/school-account/host";
import { readSchoolAccountToken } from "@/features/school-account/session";
import type { CampusSessionView } from "@/features/school-account/school-account";
import {
  changeTeacherPassword,
  createSchoolTeacher,
  listSchoolTeachers,
  resendSchoolTeacherCredentials,
  type SchoolTeachersApiError,
} from "./school-teachers-api";
import {
  toCreateTeacherInput,
  type CreatedTeacherResult,
  type TeacherAdminView,
  type TeacherSex,
} from "./school-teachers";

function isApiError(
  value: CreatedTeacherResult | CampusSessionView | SchoolTeachersApiError,
): value is SchoolTeachersApiError {
  return "error" in value && "status" in value && !("teacher" in value) && !("accountId" in value);
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

export type ListTeachersActionResult =
  | { ok: true; teachers: TeacherAdminView[] }
  | { ok: false; error: string; teachers: TeacherAdminView[] };

export async function listSchoolTeachersAction(): Promise<ListTeachersActionResult> {
  const auth = await requireCampusCall();
  if ("error" in auth) {
    return { ok: false, error: auth.error, teachers: [] };
  }

  const listed = await listSchoolTeachers(auth);
  if (listed.error !== null) {
    return { ok: false, error: listed.error, teachers: listed.teachers };
  }

  return { ok: true, teachers: listed.teachers };
}

export type CreateTeacherActionResult =
  | { ok: true } & CreatedTeacherResult
  | { ok: false; error: string };

export async function createSchoolTeacherAction(input: {
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  sex: TeacherSex | "";
  phone: string;
  email: string;
}): Promise<CreateTeacherActionResult> {
  if (input.sex === "") {
    return { ok: false, error: "Sex is required." };
  }

  const prepared = toCreateTeacherInput({ ...input, sex: input.sex });
  if ("error" in prepared) {
    return { ok: false, error: prepared.error };
  }

  const auth = await requireCampusCall();
  if ("error" in auth) {
    return { ok: false, error: auth.error };
  }

  const created = await createSchoolTeacher({
    ...auth,
    teacher: prepared,
  });

  if (isApiError(created)) {
    return { ok: false, error: created.error };
  }

  return { ok: true, ...created };
}

export async function resendSchoolTeacherCredentialsAction(
  id: string,
): Promise<CreateTeacherActionResult> {
  if (id.trim().length === 0) {
    return { ok: false, error: "Missing teacher id" };
  }

  const auth = await requireCampusCall();
  if ("error" in auth) {
    return { ok: false, error: auth.error };
  }

  const resent = await resendSchoolTeacherCredentials({ ...auth, id });
  if (isApiError(resent)) {
    return { ok: false, error: resent.error };
  }

  return { ok: true, ...resent };
}

export type ChangeTeacherPasswordActionResult =
  | { ok: true; session: CampusSessionView }
  | { ok: false; error: string };

export async function changeTeacherPasswordAction(
  password: string,
): Promise<ChangeTeacherPasswordActionResult> {
  if (password.length < 12) {
    return { ok: false, error: "Password must be at least 12 characters." };
  }

  const auth = await requireCampusCall();
  if ("error" in auth) {
    return { ok: false, error: auth.error };
  }

  const result = await changeTeacherPassword({
    ...auth,
    password,
  });

  if (isApiError(result)) {
    return { ok: false, error: result.error };
  }

  return { ok: true, session: result };
}
