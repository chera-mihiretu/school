import "server-only";

export type PlatformAdminSession = {
  email: string;
  token: string;
  expiresAt: string;
};

export type PlatformAdminIdentity = {
  email: string;
  expiresAt: string;
};

export type AdminApiError = {
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

export async function createAdminSession(input: {
  email: string;
  password: string;
  host: string;
}): Promise<PlatformAdminSession | AdminApiError> {
  const response = await fetch(`${backendUrl()}/admin/session`, {
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

  return (await response.json()) as PlatformAdminSession;
}

export async function readAdminSession(input: {
  token: string;
  host: string;
}): Promise<PlatformAdminIdentity | undefined> {
  const response = await fetch(`${backendUrl()}/admin/session`, {
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

  return (await response.json()) as PlatformAdminIdentity;
}

export async function deleteAdminSession(input: {
  token: string;
  host: string;
}): Promise<void> {
  await fetch(`${backendUrl()}/admin/session`, {
    method: "DELETE",
    headers: {
      authorization: `Bearer ${input.token}`,
      "x-school-host": input.host,
    },
    cache: "no-store",
  });
}
