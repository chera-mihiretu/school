"use server";

import { revalidatePath } from "next/cache";
import type { AdminApiError } from "./admin-api";
import {
  actOnAdminContactMessage,
  type ContactMessage,
} from "./contact-messages-api";
import { readIncomingHost } from "./host";
import { readSessionToken } from "./session";

export type ActOnMessageResult =
  | { ok: true; message: ContactMessage }
  | { ok: false; error: string };

function isErrorResult(
  value: ContactMessage | AdminApiError,
): value is AdminApiError {
  return "error" in value && "status" in value && !("email" in value);
}

export async function actOnContactMessageAction(
  id: string,
): Promise<ActOnMessageResult> {
  if (id.length === 0) {
    return { ok: false, error: "Missing message id" };
  }

  const token = await readSessionToken();
  if (token === undefined) {
    return { ok: false, error: "Sign in to act on messages" };
  }

  const updated = await actOnAdminContactMessage({
    token,
    host: await readIncomingHost(),
    id,
  });

  if (isErrorResult(updated)) {
    return { ok: false, error: updated.error };
  }

  revalidatePath("/platform-admin");
  revalidatePath("/platform-admin/messages");
  return { ok: true, message: updated };
}
