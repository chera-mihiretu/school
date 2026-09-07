import { randomUUID } from "node:crypto";
import type { StudentStorePort } from "../../domain/ports/student-store-port.ts";
import { normalizeStudentEmail, type Student } from "../../domain/students/student.ts";

type StudentRow = Student & { passwordHash: string };

function toStudent(row: StudentRow): Student {
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

function toAuth(row: StudentRow | undefined) {
  if (row === undefined) {
    return undefined;
  }
  return { student: toStudent(row), passwordHash: row.passwordHash };
}

export function createMemoryStudentStore(): StudentStorePort {
  const bySlug = new Map<string, StudentRow[]>();
  const counters = new Map<string, number>();
  let createdSeq = 0;

  function rowsFor(slug: string): StudentRow[] {
    const existing = bySlug.get(slug);
    if (existing !== undefined) {
      return existing;
    }
    const created: StudentRow[] = [];
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
      const email = normalizeStudentEmail(input.email);
      const rows = rowsFor(slug);
      if (rows.some((row) => row.email === email)) {
        return { ok: false, reason: "email_taken" };
      }
      const student: StudentRow = {
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
      rows.push(student);
      return { ok: true, student: toStudent(student) };
    },
    async findByEmail(slug, email) {
      const normalized = normalizeStudentEmail(email);
      const row = bySlug.get(slug)?.find((item) => item.email === normalized);
      return row === undefined ? undefined : toStudent(row);
    },
    async findById(slug, id) {
      const row = bySlug.get(slug)?.find((item) => item.id === id);
      return row === undefined ? undefined : toStudent(row);
    },
    async findAuthByEmail(slug, email) {
      const normalized = normalizeStudentEmail(email);
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
      return rows.map(toStudent);
    },
    async updatePassword(slug, input) {
      const row = bySlug.get(slug)?.find((item) => item.id === input.id);
      if (row === undefined) {
        return { ok: false, reason: "not_found" };
      }
      row.passwordHash = input.passwordHash;
      row.mustChangePassword = input.mustChangePassword;
      return { ok: true, student: toStudent(row) };
    },
    async recordMailAttempt(slug, id, input) {
      const row = bySlug.get(slug)?.find((item) => item.id === id);
      if (row === undefined) {
        return { ok: false, reason: "not_found" };
      }
      row.lastMailAt = input.at;
      row.lastMailOk = input.ok;
      row.lastMailError = input.ok ? null : (input.error ?? "Failed to send email");
      return { ok: true, student: toStudent(row) };
    },
    async recordSignIn(slug, id, at) {
      const row = bySlug.get(slug)?.find((item) => item.id === id);
      if (row === undefined) {
        return { ok: false, reason: "not_found" };
      }
      if (row.signedInAt === null) {
        row.signedInAt = at;
      }
      return { ok: true, student: toStudent(row) };
    },
  };
}
