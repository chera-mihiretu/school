import "server-only";

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

export type ContactSubmitInput = {
  school: string;
  name: string;
  role?: string;
  email: string;
  note?: string;
};

export async function postPublicContact(
  input: ContactSubmitInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await fetch(`${backendUrl()}/public/contact`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });

    if (!response.ok) {
      return { ok: false, error: await readError(response) };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Could not send the message. Try again." };
  }
}
