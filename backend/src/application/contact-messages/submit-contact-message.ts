import {
  normalizeContactEmail,
  normalizeContactText,
  normalizeOptionalContactText,
  validateContactEmail,
  validateContactName,
  validateContactNote,
  validateContactRole,
  validateContactSchool,
} from "../../domain/contact-messages/fields.ts";
import type { ContactMessageStorePort } from "../../domain/ports/contact-message-store-port.ts";

export type SubmitContactMessageInput = {
  school: string;
  name: string;
  role?: string;
  email: string;
  note?: string;
};

export type SubmitContactMessageResult =
  | { ok: true }
  | { ok: false; status: 400; error: string };

export type SubmitContactMessage = (
  input: SubmitContactMessageInput,
) => Promise<SubmitContactMessageResult>;

export function createSubmitContactMessage(deps: {
  store: ContactMessageStorePort;
}): SubmitContactMessage {
  const { store } = deps;

  return async (input) => {
    const school = normalizeContactText(input.school);
    const name = normalizeContactText(input.name);
    const email = normalizeContactEmail(input.email);
    const role = normalizeOptionalContactText(input.role);
    const note = normalizeContactText(input.note ?? "");

    const invalidSchool = validateContactSchool(school);
    if (invalidSchool !== undefined) {
      return { ok: false, status: 400, error: invalidSchool };
    }

    const invalidName = validateContactName(name);
    if (invalidName !== undefined) {
      return { ok: false, status: 400, error: invalidName };
    }

    const invalidEmail = validateContactEmail(email);
    if (invalidEmail !== undefined) {
      return { ok: false, status: 400, error: invalidEmail };
    }

    const invalidRole = validateContactRole(role);
    if (invalidRole !== undefined) {
      return { ok: false, status: 400, error: invalidRole };
    }

    const invalidNote = validateContactNote(note);
    if (invalidNote !== undefined) {
      return { ok: false, status: 400, error: invalidNote };
    }

    await store.insert({
      schoolName: school,
      senderName: name,
      role,
      email,
      note,
      phone: null,
    });

    return { ok: true };
  };
}
