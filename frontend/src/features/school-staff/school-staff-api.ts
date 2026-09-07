import "server-only";
import {
  parseCampusSessionView,
  type CampusSessionView,
} from "@/features/school-account/school-account";
import { readCampusAccountSession } from "@/features/school-account/school-account-api";
import {
  parseCreatedStaffResult,
  parseStaffAdminList,
  type CreateStaffInput,
  type CreatedStaffResult,
  type StaffAdminView,
} from "./school-staff";

export type SchoolStaffApiError = {
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

function campusHeaders(input: { token: string; host: string }): HeadersInit {
  return {
    authorization: `Bearer ${input.token}`,
    "x-school-host": input.host,
  };
}

export async function listSchoolStaff(input: {
  token: string;
  host: string;
}): Promise<{ staff: StaffAdminView[]; error: string | null }> {
  try {
    const response = await fetch(`${backendUrl()}/school-staff`, {
      method: "GET",
      headers: campusHeaders(input),
      cache: "no-store",
    });

    if (!response.ok) {
      return { staff: [], error: await readError(response) };
    }

    return {
      staff: parseStaffAdminList(await response.json()),
      error: null,
    };
  } catch {
    return { staff: [], error: "Could not reach the staff service" };
  }
}

export async function createSchoolStaff(input: {
  token: string;
  host: string;
  staff: CreateStaffInput;
}): Promise<CreatedStaffResult | SchoolStaffApiError> {
  try {
    const response = await fetch(`${backendUrl()}/school-staff`, {
      method: "POST",
      headers: {
        ...campusHeaders(input),
        "content-type": "application/json",
      },
      body: JSON.stringify(input.staff),
      cache: "no-store",
    });

    if (!response.ok) {
      return { status: response.status, error: await readError(response) };
    }

    const parsed = parseCreatedStaffResult(await response.json());
    if (parsed === undefined) {
      return {
        status: 502,
        error: "The create-staff service returned an unexpected body",
      };
    }

    return parsed;
  } catch {
    return { status: 503, error: "Could not reach the staff service" };
  }
}

export async function resendSchoolStaffCredentials(input: {
  token: string;
  host: string;
  id: string;
}): Promise<CreatedStaffResult | SchoolStaffApiError> {
  try {
    const response = await fetch(
      `${backendUrl()}/school-staff/${encodeURIComponent(input.id)}/resend-credentials`,
      {
        method: "POST",
        headers: campusHeaders(input),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return { status: response.status, error: await readError(response) };
    }

    const parsed = parseCreatedStaffResult(await response.json());
    if (parsed === undefined) {
      return {
        status: 502,
        error: "The resend-credentials service returned an unexpected body",
      };
    }

    return parsed;
  } catch {
    return { status: 503, error: "Could not reach the staff service" };
  }
}

export async function changeStaffPassword(input: {
  token: string;
  host: string;
  password: string;
}): Promise<CampusSessionView | SchoolStaffApiError> {
  try {
    const response = await fetch(`${backendUrl()}/school-staff/password`, {
      method: "POST",
      headers: {
        ...campusHeaders(input),
        "content-type": "application/json",
      },
      body: JSON.stringify({ password: input.password }),
      cache: "no-store",
    });

    if (!response.ok) {
      return { status: response.status, error: await readError(response) };
    }

    try {
      const body: unknown = await response.json();
      const fromBody =
        parseCampusSessionView(body) ??
        (body !== null && typeof body === "object"
          ? parseCampusSessionView((body as { session?: unknown }).session)
          : undefined);
      if (fromBody !== undefined) {
        return fromBody;
      }
    } catch {
      // Empty or non-JSON body — refresh the campus session instead.
    }

    const refreshed = await readCampusAccountSession({
      token: input.token,
      host: input.host,
    });
    if (refreshed === undefined) {
      return { status: 502, error: "Password saved, but the session could not be read" };
    }

    return refreshed;
  } catch {
    return { status: 503, error: "Could not reach the password service" };
  }
}
