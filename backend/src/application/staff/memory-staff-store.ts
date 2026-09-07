import { randomUUID } from "node:crypto";
import type { StaffStorePort } from "../../domain/ports/staff-store-port.ts";
import { normalizeStaffEmail, type Staff } from "../../domain/staff/staff.ts";

type StaffRow = Staff & { passwordHash: string };

function toStaff(row: StaffRow): Staff {
  return {
    id: row.id,
    givenName: row.givenName,
    fatherName: row.fatherName,
    grandfatherName: row.grandfatherName,
    sex: row.sex,
    phone: row.phone,
    email: row.email,
    employeeId: row.employeeId,
    mustChangePassword: row.mustChangePassword,
    lastMailAt: row.lastMailAt,
    lastMailOk: row.lastMailOk,
    lastMailError: row.lastMailError,
    signedInAt: row.signedInAt,
    createdAt: row.createdAt,
  };
}

function toAuth(row: StaffRow | undefined) {
  if (row === undefined) {
    return undefined;
  }
  return { staff: toStaff(row), passwordHash: row.passwordHash };
}

export function createMemoryStaffStore(): StaffStorePort {
  const bySlug = new Map<string, StaffRow[]>();
  const counters = new Map<string, number>();
  let createdSeq = 0;

  function rowsFor(slug: string): StaffRow[] {
    const existing = bySlug.get(slug);
    if (existing !== undefined) {
      return existing;
    }
    const created: StaffRow[] = [];
    bySlug.set(slug, created);
    return created;
  }

  return {
    async ensureSchema() {},
    async nextPersonNumber(slug, role, yearYy) {
      const key = `${slug}:${role}:${yearYy}`;
      const next = (counters.get(key) ?? 0) + 1;
      counters.set(key, next);
      return next;
    },
    async insert(slug, input) {
      const email = normalizeStaffEmail(input.email);
      const rows = rowsFor(slug);
      if (rows.some((row) => row.email === email)) {
        return { ok: false, reason: "email_taken" };
      }
      const staff: StaffRow = {
        id: randomUUID(),
        givenName: input.givenName,
        fatherName: input.fatherName,
        grandfatherName: input.grandfatherName,
        sex: input.sex,
        phone: input.phone,
        email,
        employeeId: input.employeeId,
        mustChangePassword: true,
        lastMailAt: null,
        lastMailOk: null,
        lastMailError: null,
        signedInAt: null,
        createdAt: new Date(Date.parse("2026-09-07T12:00:00.000Z") + createdSeq++),
        passwordHash: input.passwordHash,
      };
      rows.push(staff);
      return { ok: true, staff: toStaff(staff) };
    },
    async findByEmail(slug, email) {
      const normalized = normalizeStaffEmail(email);
      const row = bySlug.get(slug)?.find((item) => item.email === normalized);
      return row === undefined ? undefined : toStaff(row);
    },
    async findById(slug, id) {
      const row = bySlug.get(slug)?.find((item) => item.id === id);
      return row === undefined ? undefined : toStaff(row);
    },
    async findAuthByEmail(slug, email) {
      const normalized = normalizeStaffEmail(email);
      return toAuth(bySlug.get(slug)?.find((item) => item.email === normalized));
    },
    async findAuthByEmployeeId(slug, employeeId) {
      const needle = employeeId.trim().toUpperCase();
      if (needle.length === 0) {
        return undefined;
      }
      return toAuth(
        bySlug.get(slug)?.find(
          (item) =>
            item.employeeId !== null && item.employeeId.toUpperCase() === needle,
        ),
      );
    },
    async findAuthById(slug, id) {
      return toAuth(bySlug.get(slug)?.find((item) => item.id === id));
    },
    async listNewestFirst(slug) {
      const rows = [...(bySlug.get(slug) ?? [])].sort((left, right) => {
        const created = right.createdAt.getTime() - left.createdAt.getTime();
        if (created !== 0) {
          return created;
        }
        return right.id.localeCompare(left.id);
      });
      return rows.map(toStaff);
    },
    async updatePassword(slug, input) {
      const row = bySlug.get(slug)?.find((item) => item.id === input.id);
      if (row === undefined) {
        return { ok: false, reason: "not_found" };
      }
      row.passwordHash = input.passwordHash;
      row.mustChangePassword = input.mustChangePassword;
      return { ok: true, staff: toStaff(row) };
    },
    async recordMailAttempt(slug, id, input) {
      const row = bySlug.get(slug)?.find((item) => item.id === id);
      if (row === undefined) {
        return { ok: false, reason: "not_found" };
      }
      row.lastMailAt = input.at;
      row.lastMailOk = input.ok;
      row.lastMailError = input.ok ? null : (input.error ?? "Failed to send email");
      return { ok: true, staff: toStaff(row) };
    },
    async recordSignIn(slug, id, at) {
      const row = bySlug.get(slug)?.find((item) => item.id === id);
      if (row === undefined) {
        return { ok: false, reason: "not_found" };
      }
      if (row.signedInAt === null) {
        row.signedInAt = at;
      }
      return { ok: true, staff: toStaff(row) };
    },
  };
}
