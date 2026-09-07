import { cookies, headers } from "next/headers";
import { SCHOOL_ACCOUNT_SESSION_COOKIE } from "./constants";
import { readIncomingHost } from "./host";
import type { CampusSessionView, SchoolSessionView } from "./school-account";
import {
  readCampusAccountSession,
  readSchoolAccountSession,
} from "./school-account-api";

export async function setSchoolAccountCookie(input: {
  token: string;
  expiresAt: string;
}): Promise<void> {
  const cookieStore = await cookies();
  const headerList = await headers();

  cookieStore.set({
    name: SCHOOL_ACCOUNT_SESSION_COOKIE,
    value: input.token,
    httpOnly: true,
    sameSite: "lax",
    secure: headerList.get("x-forwarded-proto") === "https",
    path: "/",
    expires: new Date(input.expiresAt),
  });
}

export async function clearSchoolAccountCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SCHOOL_ACCOUNT_SESSION_COOKIE);
}

export async function readSchoolAccountToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SCHOOL_ACCOUNT_SESSION_COOKIE)?.value;
  if (token === undefined || token.length === 0) {
    return undefined;
  }

  return token;
}

export async function getSchoolAccountSession(): Promise<
  SchoolSessionView | undefined
> {
  const token = await readSchoolAccountToken();
  if (token === undefined) {
    return undefined;
  }

  return readSchoolAccountSession({
    token,
    host: await readIncomingHost(),
  });
}

export async function getCampusAccountSession(): Promise<
  CampusSessionView | undefined
> {
  const token = await readSchoolAccountToken();
  if (token === undefined) {
    return undefined;
  }

  return readCampusAccountSession({
    token,
    host: await readIncomingHost(),
  });
}
