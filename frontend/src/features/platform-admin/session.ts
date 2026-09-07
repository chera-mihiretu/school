import { cookies, headers } from "next/headers";
import { readAdminSession, type PlatformAdminIdentity } from "./admin-api";
import { PLATFORM_ADMIN_SESSION_COOKIE } from "./constants";
import { readIncomingHost } from "./host";

export async function setPlatformAdminCookie(input: {
  token: string;
  expiresAt: string;
}): Promise<void> {
  const cookieStore = await cookies();
  const headerList = await headers();

  cookieStore.set({
    name: PLATFORM_ADMIN_SESSION_COOKIE,
    value: input.token,
    httpOnly: true,
    sameSite: "lax",
    secure: headerList.get("x-forwarded-proto") === "https",
    path: "/",
    expires: new Date(input.expiresAt),
  });
}

export async function clearPlatformAdminCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PLATFORM_ADMIN_SESSION_COOKIE);
}

export async function getPlatformAdminIdentity(): Promise<
  PlatformAdminIdentity | undefined
> {
  const token = await readSessionToken();
  if (token === undefined) {
    return undefined;
  }

  return readAdminSession({
    token,
    host: await readIncomingHost(),
  });
}

export async function readSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PLATFORM_ADMIN_SESSION_COOKIE)?.value;
  if (token === undefined || token.length === 0) {
    return undefined;
  }

  return token;
}
