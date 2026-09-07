import "server-only";
import type { AdminApiError } from "./admin-api";

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

export type ContactMessage = {
  id: string;
  school: string;
  name: string;
  role: string | null;
  email: string;
  note: string;
  phone: string | null;
  created: string;
  acted: boolean;
};

export type ContactMessagesList = {
  messages: ContactMessage[];
  page: number;
  pageSize: number;
  total: number;
  pending: number;
  error: string | null;
};

function parseMessage(value: unknown): ContactMessage | undefined {
  if (value === null || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string" || record.id.length === 0) {
    return undefined;
  }
  if (typeof record.school !== "string" || record.school.length === 0) {
    return undefined;
  }
  if (typeof record.name !== "string" || record.name.length === 0) {
    return undefined;
  }
  if (typeof record.email !== "string" || record.email.length === 0) {
    return undefined;
  }

  return {
    id: record.id,
    school: record.school,
    name: record.name,
    role: typeof record.role === "string" ? record.role : null,
    email: record.email,
    note: typeof record.note === "string" ? record.note : "",
    phone: typeof record.phone === "string" ? record.phone : null,
    created: typeof record.created === "string" ? record.created : "",
    acted: record.acted === true,
  };
}

export async function listAdminContactMessages(input: {
  token: string;
  host: string;
  page?: number;
  pageSize?: number;
}): Promise<ContactMessagesList> {
  const query = new URLSearchParams();
  if (input.page !== undefined) {
    query.set("page", String(input.page));
  }
  if (input.pageSize !== undefined) {
    query.set("pageSize", String(input.pageSize));
  }
  const encoded = query.toString();
  const suffix = encoded.length > 0 ? `?${encoded}` : "";

  try {
    const response = await fetch(
      `${backendUrl()}/admin/contact-messages${suffix}`,
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
      const error: AdminApiError = {
        status: response.status,
        error: await readError(response),
      };
      return {
        messages: [],
        page: 1,
        pageSize: 50,
        total: 0,
        pending: 0,
        error: error.error,
      };
    }

    const body: unknown = await response.json();
    const record = body !== null && typeof body === "object" ? body : {};
    const rawMessages =
      "messages" in record && Array.isArray(record.messages)
        ? record.messages
        : [];

    return {
      messages: rawMessages.flatMap((item) => {
        const message = parseMessage(item);
        return message === undefined ? [] : [message];
      }),
      page:
        "page" in record && typeof record.page === "number" ? record.page : 1,
      pageSize:
        "pageSize" in record && typeof record.pageSize === "number"
          ? record.pageSize
          : 50,
      total:
        "total" in record && typeof record.total === "number" ? record.total : 0,
      pending:
        "pending" in record && typeof record.pending === "number"
          ? record.pending
          : 0,
      error: null,
    };
  } catch {
    return {
      messages: [],
      page: 1,
      pageSize: 50,
      total: 0,
      pending: 0,
      error: "Could not reach the contact-messages service",
    };
  }
}

export async function actOnAdminContactMessage(input: {
  token: string;
  host: string;
  id: string;
}): Promise<ContactMessage | AdminApiError> {
  try {
    const response = await fetch(
      `${backendUrl()}/admin/contact-messages/${encodeURIComponent(input.id)}/act`,
      {
        method: "POST",
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

    const body: unknown = await response.json();
    const record = body !== null && typeof body === "object" ? body : {};
    const message =
      "message" in record ? parseMessage(record.message) : undefined;
    if (message === undefined) {
      return { status: 502, error: "Unexpected act response" };
    }
    return message;
  } catch {
    return { status: 503, error: "Could not reach the contact-messages service" };
  }
}
