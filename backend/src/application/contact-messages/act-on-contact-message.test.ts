import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ContactMessage } from "../../domain/contact-messages/contact-message.ts";
import { createActOnContactMessage } from "./act-on-contact-message.ts";
import { createMemoryContactMessageStore } from "./memory-contact-message-store.ts";

const openMessage: ContactMessage = {
  id: "11111111-1111-1111-1111-111111111111",
  schoolName: "North Hall",
  senderName: "Ada",
  role: "Director",
  email: "ada@north-hall.edu",
  note: "We would like a campus.",
  phone: null,
  createdAt: new Date("2026-09-01T10:00:00.000Z"),
  actedAt: null,
};

describe("createActOnContactMessage", () => {
  it("marks an open message acted on the admin host", async () => {
    const store = createMemoryContactMessageStore([openMessage]);
    const act = createActOnContactMessage({
      rootHost: "e-school.et",
      store,
    });

    const result = await act({
      hostHeader: "admin.e-school.et:3000",
      id: openMessage.id,
    });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.message.id, openMessage.id);
    assert.equal(result.message.acted, true);

    const again = await act({
      hostHeader: "admin.e-school.et",
      id: openMessage.id,
    });
    assert.equal(again.ok, true);
    if (!again.ok) {
      return;
    }
    assert.equal(again.message.acted, true);
  });

  it("returns 404 for an unknown id", async () => {
    const act = createActOnContactMessage({
      rootHost: "e-school.et",
      store: createMemoryContactMessageStore([openMessage]),
    });

    const result = await act({
      hostHeader: "admin.e-school.et",
      id: "99999999-9999-9999-9999-999999999999",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 404);
    }
  });

  it("returns 404 for a non-uuid id", async () => {
    const act = createActOnContactMessage({
      rootHost: "e-school.et",
      store: createMemoryContactMessageStore([openMessage]),
    });

    const result = await act({
      hostHeader: "admin.e-school.et",
      id: "not-a-uuid",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 404);
    }
  });

  it("rejects school hosts", async () => {
    const act = createActOnContactMessage({
      rootHost: "e-school.et",
      store: createMemoryContactMessageStore([openMessage]),
    });

    const result = await act({
      hostHeader: "north-hall.e-school.et",
      id: openMessage.id,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 403);
    }
  });
});
