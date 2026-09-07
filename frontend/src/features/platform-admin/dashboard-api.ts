import "server-only";
import { cache } from "react";
import {
  EMPTY_ADMIN_DASHBOARD,
  parseAdminDashboardStats,
  type AdminDashboardStats,
} from "./dashboard";

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

export type AdminDashboardList = AdminDashboardStats & {
  error: string | null;
};

const fetchAdminDashboard = cache(
  async (token: string, host: string): Promise<AdminDashboardList> => {
    try {
      const response = await fetch(`${backendUrl()}/admin/dashboard`, {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
          "x-school-host": host,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        return {
          ...EMPTY_ADMIN_DASHBOARD,
          error: await readError(response),
        };
      }

      return {
        ...parseAdminDashboardStats(await response.json()),
        error: null,
      };
    } catch {
      return {
        ...EMPTY_ADMIN_DASHBOARD,
        error: "Could not reach the dashboard service",
      };
    }
  },
);

export async function getAdminDashboard(input: {
  token: string;
  host: string;
}): Promise<AdminDashboardList> {
  return fetchAdminDashboard(input.token, input.host);
}
