import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ContactMessage } from "../../domain/contact-messages/contact-message.ts";
import { createListAdminContactMessages } from "./list-admin-contact-messages.ts";
import { createMemoryContactMessageStore } from "./memory-contact-message-store.ts";

const older: ContactMessage = {
  id: "11111111-1111-1111-1111-111111111111",
  schoolName: "North Hall",
  senderName: "Ada",
  role: "Director",
  email: "ada@north-hall.edu",
  note: "First",
  phone: null,
  createdAt: new Date("2026-09-01T10:00:00.000Z"),
  actedAt: null,
};

const newer: ContactMessage = {
  id: "22222222-2222-2222-2222-222222222222",
  schoolName: "East Yard",
  senderName: "Bereket",
  role: null,
  email: "bereket@east.et",
  note: "Second",
  phone: null,
  createdAt: new Date("2026-09-06T10:00:00.000Z"),
  actedAt: null,
};

const actedNewest: ContactMessage = {
  id: "33333333-3333-3333-3333-333333333333",
  schoolName: "West Gate",
  senderName: "Chaltu",
  role: null,
  email: "chaltu@west.et",
  note: "Already handled",
  phone: null,
  createdAt: new Date("2026-09-07T10:00:00.000Z"),
  actedAt: new Date("2026-09-07T11:00:00.000Z"),
};

describe("createListAdminContactMessages", () => {
  it("lists newest first on the admin host", async () => {
    const list = createListAdminContactMessages({
      rootHost: "e-school.et",
      store: createMemoryContactMessageStore([older, newer]),
    });

    const result = await list({ hostHeader: "admin.e-school.et:3000" });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.deepEqual(
      result.messages.map((message) => message.id),
      [newer.id, older.id],
    );
    assert.equal(result.total, 2);
    assert.equal(result.pending, 2);
    assert.equal(result.page, 1);
    assert.equal(result.pageSize, 50);
    assert.deepEqual(result.messages[0], {
      id: newer.id,
      school: "East Yard",
      name: "Bereket",
      role: null,
      email: "bereket@east.et",
      note: "Second",
      phone: null,
      created: "2026-09-06T10:00:00.000Z",
      acted: false,
    });
  });

  it("lists unacted messages before acted messages", async () => {
    const list = createListAdminContactMessages({
      rootHost: "e-school.et",
      store: createMemoryContactMessageStore([older, newer, actedNewest]),
    });

    const result = await list({ hostHeader: "admin.e-school.et" });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.deepEqual(
      result.messages.map((message) => message.id),
      [newer.id, older.id, actedNewest.id],
    );
    assert.equal(result.pending, 2);
    assert.equal(result.messages[2]?.acted, true);
  });

  it("paginates when page and pageSize are set", async () => {
    const list = createListAdminContactMessages({
      rootHost: "e-school.et",
      store: createMemoryContactMessageStore([older, newer]),
    });

    const result = await list({
      hostHeader: "admin.e-school.et",
      page: 2,
      pageSize: 1,
    });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.page, 2);
    assert.equal(result.pageSize, 1);
    assert.equal(result.total, 2);
    assert.deepEqual(
      result.messages.map((message) => message.id),
      [older.id],
    );
  });

  it("rejects school hosts", async () => {
    const list = createListAdminContactMessages({
      rootHost: "e-school.et",
      store: createMemoryContactMessageStore([newer]),
    });

    const result = await list({ hostHeader: "north-hall.e-school.et" });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 403);
    }
  });
});
