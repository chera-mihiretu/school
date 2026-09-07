import type { ContactMessage } from "../../domain/contact-messages/contact-message.ts";

export type ContactMessageView = {
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

export function toContactMessageView(message: ContactMessage): ContactMessageView {
  return {
    id: message.id,
    school: message.schoolName,
    name: message.senderName,
    role: message.role,
    email: message.email,
    note: message.note,
    phone: message.phone,
    created: message.createdAt.toISOString(),
    acted: message.actedAt !== null,
  };
}
