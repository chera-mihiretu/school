import "server-only";
import {
  parseCampusSessionView,
  parseCampusSignInView,
  type CampusSessionView,
  type CampusSignInView,
  type ClaimUsernameView,
  type SchoolSessionView,
  type SchoolSignInView,
  type UsernameLookup,
} from "./school-account";
import {
  parseAbbreviationPreview,
  parseClaimedAbbreviation,
  type AbbreviationPreview,
  type ClaimedAbbreviation,
} from "./school-abbreviation";

export type SchoolAccountApiError = {
  status: number;
  error: string;
};

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

export async function createSchoolAccountSession(input: {
  email: string;
  password: string;
  host: string;
}): Promise<SchoolSignInView | SchoolAccountApiError> {
  const response = await fetch(`${backendUrl()}/school-accounts/session`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-school-host": input.host,
    },
    body: JSON.stringify({ email: input.email, password: input.password }),
    cache: "no-store",
  });

  if (!response.ok) {
    return { status: response.status, error: await readError(response) };
  }

  return (await response.json()) as SchoolSignInView;
}

export async function readSchoolAccountSession(input: {
  token: string;
  host: string;
}): Promise<SchoolSessionView | undefined> {
  const response = await fetch(`${backendUrl()}/school-accounts/session`, {
    method: "GET",
    headers: {
      authorization: `Bearer ${input.token}`,
      "x-school-host": input.host,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return undefined;
  }

  return (await response.json()) as SchoolSessionView;
}

export async function deleteSchoolAccountSession(input: {
  token: string;
  host: string;
}): Promise<void> {
  await fetch(`${backendUrl()}/school-accounts/session`, {
    method: "DELETE",
    headers: {
      authorization: `Bearer ${input.token}`,
      "x-school-host": input.host,
    },
    cache: "no-store",
  });
}

export async function changeSchoolAccountPassword(input: {
  token: string;
  host: string;
  currentPassword: string;
  newPassword: string;
}): Promise<SchoolSessionView | SchoolAccountApiError> {
  const response = await fetch(`${backendUrl()}/school-accounts/password`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${input.token}`,
      "x-school-host": input.host,
    },
    body: JSON.stringify({
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return { status: response.status, error: await readError(response) };
  }

  return (await response.json()) as SchoolSessionView;
}

function parseUsernameLookup(value: unknown): UsernameLookup | undefined {
  if (value === null || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.username !== "string") {
    return undefined;
  }
  if (record.available === true) {
    return { available: true, username: record.username };
  }
  if (record.available !== false) {
    return undefined;
  }

  const reason = record.reason;
  if (reason !== "invalid" && reason !== "reserved" && reason !== "taken") {
    return undefined;
  }

  return { available: false, username: record.username, reason };
}

export async function lookupSchoolAccountUsername(input: {
  token: string;
  host: string;
  slug: string;
}): Promise<UsernameLookup | SchoolAccountApiError> {
  const query = new URLSearchParams({ slug: input.slug });
  const response = await fetch(
    `${backendUrl()}/school-accounts/username?${query.toString()}`,
    {
      method: "GET",
      headers: {
        authorization: `Bearer ${input.token}`,
        "x-school-host": input.host,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return { status: response.status, error: await readError(response) };
  }

  const parsed = parseUsernameLookup(await response.json());
  if (parsed === undefined) {
    return { status: 502, error: "Unexpected username lookup response" };
  }

  return parsed;
}

export async function claimSchoolAccountUsername(input: {
  token: string;
  host: string;
  slug: string;
}): Promise<ClaimUsernameView | SchoolAccountApiError> {
  const response = await fetch(`${backendUrl()}/school-accounts/username`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${input.token}`,
      "x-school-host": input.host,
    },
    body: JSON.stringify({ slug: input.slug }),
    cache: "no-store",
  });

  if (!response.ok) {
    return { status: response.status, error: await readError(response) };
  }

  return (await response.json()) as ClaimUsernameView;
}

export async function readSchoolAccountAbbreviation(input: {
  token: string;
  host: string;
  code?: string;
}): Promise<AbbreviationPreview | SchoolAccountApiError> {
  const query =
    input.code !== undefined && input.code.length > 0
      ? `?${new URLSearchParams({ code: input.code }).toString()}`
      : "";
  const response = await fetch(
    `${backendUrl()}/school-accounts/abbreviation${query}`,
    {
      method: "GET",
      headers: {
        authorization: `Bearer ${input.token}`,
        "x-school-host": input.host,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return { status: response.status, error: await readError(response) };
  }

  const parsed = parseAbbreviationPreview(await response.json());
  if (parsed === undefined) {
    return { status: 502, error: "Unexpected abbreviation response" };
  }
  return parsed;
}

export async function claimSchoolAccountAbbreviation(input: {
  token: string;
  host: string;
  abbreviation?: string;
}): Promise<ClaimedAbbreviation | SchoolAccountApiError> {
  const response = await fetch(`${backendUrl()}/school-accounts/abbreviation`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${input.token}`,
      "x-school-host": input.host,
    },
    body: JSON.stringify(
      input.abbreviation === undefined ? {} : { abbreviation: input.abbreviation },
    ),
    cache: "no-store",
  });

  if (!response.ok) {
    return { status: response.status, error: await readError(response) };
  }

  const parsed = parseClaimedAbbreviation(await response.json());
  if (parsed === undefined) {
    return { status: 502, error: "Unexpected abbreviation claim response" };
  }
  return parsed;
}

export async function readSchoolSettingsAbbreviation(input: {
  token: string;
  host: string;
  code?: string;
}): Promise<AbbreviationPreview | SchoolAccountApiError> {
  const query =
    input.code !== undefined && input.code.length > 0
      ? `?${new URLSearchParams({ code: input.code }).toString()}`
      : "";
  const response = await fetch(
    `${backendUrl()}/school-settings/abbreviation${query}`,
    {
      method: "GET",
      headers: {
        authorization: `Bearer ${input.token}`,
        "x-school-host": input.host,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return { status: response.status, error: await readError(response) };
  }

  const parsed = parseAbbreviationPreview(await response.json());
  if (parsed === undefined) {
    return { status: 502, error: "Unexpected abbreviation response" };
  }
  return parsed;
}

export async function claimSchoolSettingsAbbreviation(input: {
  token: string;
  host: string;
  abbreviation?: string;
}): Promise<{ abbreviation: string; locked: true } | SchoolAccountApiError> {
  const response = await fetch(`${backendUrl()}/school-settings/abbreviation`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${input.token}`,
      "x-school-host": input.host,
    },
    body: JSON.stringify(
      input.abbreviation === undefined ? {} : { abbreviation: input.abbreviation },
    ),
    cache: "no-store",
  });

  if (!response.ok) {
    return { status: response.status, error: await readError(response) };
  }

  const body = (await response.json()) as {
    abbreviation?: unknown;
    locked?: unknown;
  };
  if (typeof body.abbreviation !== "string" || body.abbreviation.length === 0) {
    return { status: 502, error: "Unexpected abbreviation claim response" };
  }
  return { abbreviation: body.abbreviation, locked: true };
}

export async function createCampusAccountSession(input: {
  identifier: string;
  password: string;
  host: string;
}): Promise<CampusSignInView | SchoolAccountApiError> {
  const response = await fetch(`${backendUrl()}/school-accounts/campus-session`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-school-host": input.host,
    },
    body: JSON.stringify({
      identifier: input.identifier,
      email: input.identifier,
      password: input.password,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return { status: response.status, error: await readError(response) };
  }

  const parsed = parseCampusSignInView(await response.json());
  if (parsed === undefined) {
    return { status: 502, error: "Unexpected campus sign-in response" };
  }

  return parsed;
}

export async function readCampusAccountSession(input: {
  token: string;
  host: string;
}): Promise<CampusSessionView | undefined> {
  const response = await fetch(`${backendUrl()}/school-accounts/campus-session`, {
    method: "GET",
    headers: {
      authorization: `Bearer ${input.token}`,
      "x-school-host": input.host,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return undefined;
  }

  return parseCampusSessionView(await response.json());
}
