import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMemoryContactMessageStore } from "./memory-contact-message-store.ts";
import { createSubmitContactMessage } from "./submit-contact-message.ts";

describe("createSubmitContactMessage", () => {
  it("stores a valid public message", async () => {
    const store = createMemoryContactMessageStore();
    const submit = createSubmitContactMessage({ store });

    const result = await submit({
      school: "  North Hall  ",
      name: " Ada Lemma ",
      role: "Director",
      email: "Ada@North-Hall.edu",
      note: "We would like a campus.",
    });

    assert.equal(result.ok, true);
    const listed = await store.listNewest({ limit: 10, offset: 0 });
    assert.equal(listed.total, 1);
    const message = listed.messages[0];
    assert.ok(message);
    assert.equal(message.schoolName, "North Hall");
    assert.equal(message.senderName, "Ada Lemma");
    assert.equal(message.role, "Director");
    assert.equal(message.email, "ada@north-hall.edu");
    assert.equal(message.note, "We would like a campus.");
    assert.equal(message.phone, null);
  });

  it("rejects missing school, name, and invalid email", async () => {
    const submit = createSubmitContactMessage({
      store: createMemoryContactMessageStore(),
    });

    const missingSchool = await submit({
      school: "   ",
      name: "Ada",
      email: "ada@school.et",
    });
    assert.equal(missingSchool.ok, false);
    if (!missingSchool.ok) {
      assert.equal(missingSchool.status, 400);
      assert.match(missingSchool.error, /School name/);
    }

    const missingName = await submit({
      school: "North Hall",
      name: "",
      email: "ada@school.et",
    });
    assert.equal(missingName.ok, false);
    if (!missingName.ok) {
      assert.equal(missingName.status, 400);
      assert.match(missingName.error, /Name/);
    }

    const invalidEmail = await submit({
      school: "North Hall",
      name: "Ada",
      email: "not-an-email",
    });
    assert.equal(invalidEmail.ok, false);
    if (!invalidEmail.ok) {
      assert.equal(invalidEmail.status, 400);
      assert.match(invalidEmail.error, /email/i);
    }
  });

  it("treats a blank role as null and allows an empty note", async () => {
    const store = createMemoryContactMessageStore();
    const submit = createSubmitContactMessage({ store });

    const result = await submit({
      school: "North Hall",
      name: "Ada",
      role: "  ",
      email: "ada@school.et",
    });

    assert.equal(result.ok, true);
    const listed = await store.listNewest({ limit: 1, offset: 0 });
    assert.equal(listed.messages[0]?.role, null);
    assert.equal(listed.messages[0]?.note, "");
  });
});
