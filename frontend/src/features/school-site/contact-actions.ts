"use server";

import { postPublicContact } from "./contact-api";

export type SubmitContactResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitContactMessage(input: {
  school: string;
  name: string;
  role: string;
  email: string;
  note: string;
}): Promise<SubmitContactResult> {
  const school = input.school.trim();
  const name = input.name.trim();
  const email = input.email.trim();
  const role = input.role.trim();
  const note = input.note.trim();

  if (school.length === 0 || name.length === 0 || email.length === 0) {
    return { ok: false, error: "School name, your name, and email are required." };
  }

  return postPublicContact({
    school,
    name,
    email,
    ...(role.length > 0 ? { role } : {}),
    ...(note.length > 0 ? { note } : {}),
  });
}
