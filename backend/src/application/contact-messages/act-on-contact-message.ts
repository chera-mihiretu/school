import { isContactMessageId } from "../../domain/contact-messages/contact-message.ts";
import type { ContactMessageStorePort } from "../../domain/ports/contact-message-store-port.ts";
import { rejectIfNotAdminHost } from "../platform-admin/require-admin-host.ts";
import { toContactMessageView, type ContactMessageView } from "./views.ts";

export type ActOnContactMessageInput = {
  hostHeader: string;
  id: string;
};

export type ActOnContactMessageResult =
  | { ok: true; message: ContactMessageView }
  | { ok: false; status: 403 | 404; error: string };

export type ActOnContactMessage = (
  input: ActOnContactMessageInput,
) => Promise<ActOnContactMessageResult>;

export function createActOnContactMessage(deps: {
  rootHost: string;
  store: ContactMessageStorePort;
}): ActOnContactMessage {
  const { rootHost, store } = deps;

  return async (input) => {
    const rejected = rejectIfNotAdminHost(input.hostHeader, rootHost);
    if (rejected !== undefined) {
      return rejected;
    }

    if (!isContactMessageId(input.id)) {
      return { ok: false, status: 404, error: "Message not found" };
    }

    const message = await store.markActed(input.id);
    if (message === undefined) {
      return { ok: false, status: 404, error: "Message not found" };
    }

    return { ok: true, message: toContactMessageView(message) };
  };
}
