import type { ContactMessage } from "../contact-messages/contact-message.ts";

export type ContactMessageInsert = {
  schoolName: string;
  senderName: string;
  role: string | null;
  email: string;
  note: string;
  phone: string | null;
};

export type ContactMessageListQuery = {
  limit: number;
  offset: number;
};

export type ContactMessageListResult = {
  messages: ContactMessage[];
  total: number;
  pending: number;
};

export type ContactMessageStorePort = {
  ensureSchema: () => Promise<void>;
  insert: (input: ContactMessageInsert) => Promise<ContactMessage>;
  listNewest: (query: ContactMessageListQuery) => Promise<ContactMessageListResult>;
  markActed: (id: string) => Promise<ContactMessage | undefined>;
};
