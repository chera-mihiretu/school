import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSignInPlatformAdmin } from "./sign-in.ts";

const sessions = {
  issue(_email: string) {
    return {
      token: "tok",
      expiresAt: new Date("2026-09-05T12:00:00.000Z"),
    };
  },
  read() {
    return undefined;
  },
};

describe("createSignInPlatformAdmin", () => {
  it("issues a session on the admin host with valid credentials", async () => {
    const signIn = createSignInPlatformAdmin({
      rootHost: "e-school.et",
      credentials: {
        verify: async (email, password) =>
          email === "admin@e-school.et" && password === "secret",
      },
      sessions,
    });

    const result = await signIn({
      email: "Admin@e-school.et",
      password: "secret",
      hostHeader: "admin.e-school.et:3000",
    });

    assert.deepEqual(result, {
      ok: true,
      session: {
        email: "admin@e-school.et",
        token: "tok",
        expiresAt: "2026-09-05T12:00:00.000Z",
      },
    });
  });

  it("rejects school hosts and bad passwords", async () => {
    const signIn = createSignInPlatformAdmin({
      rootHost: "e-school.et",
      credentials: { verify: async () => true },
      sessions,
    });

    const fromSchool = await signIn({
      email: "admin@e-school.et",
      password: "secret",
      hostHeader: "demo.e-school.et:3000",
    });
    assert.equal(fromSchool.ok, false);
    if (!fromSchool.ok) {
      assert.equal(fromSchool.status, 403);
    }

    const badPassword = await createSignInPlatformAdmin({
      rootHost: "e-school.et",
      credentials: { verify: async () => false },
      sessions,
    })({
      email: "admin@e-school.et",
      password: "nope",
      hostHeader: "admin.e-school.et",
    });
    assert.equal(badPassword.ok, false);
    if (!badPassword.ok) {
      assert.equal(badPassword.status, 401);
    }
  });
});
