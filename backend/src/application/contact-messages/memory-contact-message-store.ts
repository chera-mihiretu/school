import { randomUUID } from "node:crypto";
import type { ContactMessage } from "../../domain/contact-messages/contact-message.ts";
import type { ContactMessageStorePort } from "../../domain/ports/contact-message-store-port.ts";

export function createMemoryContactMessageStore(
  seed: ContactMessage[] = [],
): ContactMessageStorePort {
  const rows = seed.map((message) => ({ ...message }));

  return {
    async ensureSchema() {},
    async insert(input) {
      const message: ContactMessage = {
        id: randomUUID(),
        schoolName: input.schoolName,
        senderName: input.senderName,
        role: input.role,
        email: input.email,
        note: input.note,
        phone: input.phone,
        createdAt: new Date(),
        actedAt: null,
      };
      rows.push(message);
      return message;
    },
    async listNewest(query) {
      const newest = [...rows].sort((left, right) => {
        const leftOpen = left.actedAt === null ? 0 : 1;
        const rightOpen = right.actedAt === null ? 0 : 1;
        if (leftOpen !== rightOpen) {
          return leftOpen - rightOpen;
        }
        return right.createdAt.getTime() - left.createdAt.getTime();
      });
      return {
        messages: newest.slice(query.offset, query.offset + query.limit),
        total: newest.length,
        pending: newest.filter((message) => message.actedAt === null).length,
      };
    },
    async markActed(id) {
      const index = rows.findIndex((message) => message.id === id);
      if (index < 0) {
        return undefined;
      }
      const current = rows[index];
      if (current === undefined) {
        return undefined;
      }
      if (current.actedAt !== null) {
        return current;
      }
      const updated = { ...current, actedAt: new Date() };
      rows[index] = updated;
      return updated;
    },
  };
}
