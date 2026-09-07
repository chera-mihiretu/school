import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { ActOnContactMessage } from "../../application/contact-messages/act-on-contact-message.ts";
import type { ListAdminContactMessages } from "../../application/contact-messages/list-admin-contact-messages.ts";
import type { SubmitContactMessage } from "../../application/contact-messages/submit-contact-message.ts";
import type { CreateFeaturedSchool } from "../../application/featured-schools/create-featured-school.ts";
import type { DeleteFeaturedSchool } from "../../application/featured-schools/delete-featured-school.ts";
import type { ListAdminFeaturedSchools } from "../../application/featured-schools/list-admin-featured-schools.ts";
import type { ListPublicFeaturedSchools } from "../../application/featured-schools/list-public-featured-schools.ts";
import type { UpdateFeaturedSchool } from "../../application/featured-schools/update-featured-school.ts";
import type { GetHealth } from "../../application/health/get-health.ts";
import type { ResolvePublicHost } from "../../application/public-host/resolve-public-host.ts";
import type { ChangeSchoolAccountPassword } from "../../application/school-accounts/change-password.ts";
import type { ClaimSchoolAccountUsername } from "../../application/school-accounts/claim-username.ts";
import type { ClaimAppAbbreviation } from "../../application/school-accounts/claim-abbreviation.ts";
import type { LookupSchoolAccountUsername } from "../../application/school-accounts/lookup-username.ts";
import type { ReadAppAbbreviation } from "../../application/school-accounts/read-abbreviation.ts";
import type { ReadCampusAccountSession } from "../../application/school-accounts/read-campus-session.ts";
import type { ReadSchoolAccountSession } from "../../application/school-accounts/read-session.ts";
import type { SignInCampusAccount } from "../../application/school-accounts/sign-in-campus.ts";
import type { SignInSchoolAccount } from "../../application/school-accounts/sign-in.ts";
import type { ChangeStaffPassword } from "../../application/staff/change-staff-password.ts";
import type { CreateStaff } from "../../application/staff/create-staff.ts";
import type { ListSchoolStaff } from "../../application/staff/list-staff.ts";
import type { ResendStaffCredentials } from "../../application/staff/resend-staff-credentials.ts";
import type { ChangeStudentPassword } from "../../application/students/change-student-password.ts";
import type { CreateStudent } from "../../application/students/create-student.ts";
import type { ListSchoolStudents } from "../../application/students/list-students.ts";
import type { ResendStudentCredentials } from "../../application/students/resend-student-credentials.ts";
import type { ChangeTeacherPassword } from "../../application/teachers/change-teacher-password.ts";
import type { CreateTeacher } from "../../application/teachers/create-teacher.ts";
import type { ListSchoolTeachers } from "../../application/teachers/list-teachers.ts";
import type { ResendTeacherCredentials } from "../../application/teachers/resend-teacher-credentials.ts";
import type { ClaimSettingsAbbreviation } from "../../application/school-settings/claim-abbreviation.ts";
import type { ReadSettingsAbbreviation } from "../../application/school-settings/read-abbreviation.ts";
import type { ReadPlatformAdminSession } from "../../application/platform-admin/read-session.ts";
import type { SignInPlatformAdmin } from "../../application/platform-admin/sign-in.ts";
import type { CreateTenant } from "../../application/tenants/create-tenant.ts";
import type { GetAdminDashboard } from "../../application/tenants/get-admin-dashboard.ts";
import type { ListAdminTenants } from "../../application/tenants/list-admin-tenants.ts";
import type { LookupTenantUsername } from "../../application/tenants/lookup-tenant-username.ts";
import type { ResendTenantCredentials } from "../../application/tenants/resend-tenant-credentials.ts";
import type { SetTenantStatus } from "../../application/tenants/set-tenant-status.ts";
import type { LoggerPort } from "../../domain/ports/logger-port.ts";
import { getPathname, getRequestUrl, sendJson } from "./http.ts";
import { readJsonBody } from "./read-json.ts";

export type CreateAppDeps = {
  logger: LoggerPort;
  getHealth: GetHealth;
  signInPlatformAdmin: SignInPlatformAdmin;
  readPlatformAdminSession: ReadPlatformAdminSession;
  listPublicFeaturedSchools: ListPublicFeaturedSchools;
  resolvePublicHost: ResolvePublicHost;
  listAdminFeaturedSchools: ListAdminFeaturedSchools;
  createFeaturedSchool: CreateFeaturedSchool;
  updateFeaturedSchool: UpdateFeaturedSchool;
  deleteFeaturedSchool: DeleteFeaturedSchool;
  createTenant: CreateTenant;
  listAdminTenants: ListAdminTenants;
  getAdminDashboard: GetAdminDashboard;
  lookupTenantUsername: LookupTenantUsername;
  suspendTenant: SetTenantStatus;
  reactivateTenant: SetTenantStatus;
  resendTenantCredentials: ResendTenantCredentials;
  submitContactMessage: SubmitContactMessage;
  listAdminContactMessages: ListAdminContactMessages;
  actOnContactMessage: ActOnContactMessage;
  signInSchoolAccount: SignInSchoolAccount;
  readSchoolAccountSession: ReadSchoolAccountSession;
  changeSchoolAccountPassword: ChangeSchoolAccountPassword;
  claimSchoolAccountUsername: ClaimSchoolAccountUsername;
  lookupSchoolAccountUsername: LookupSchoolAccountUsername;
  readAppAbbreviation: ReadAppAbbreviation;
  claimAppAbbreviation: ClaimAppAbbreviation;
  readSettingsAbbreviation: ReadSettingsAbbreviation;
  claimSettingsAbbreviation: ClaimSettingsAbbreviation;
  signInCampusAccount: SignInCampusAccount;
  readCampusAccountSession: ReadCampusAccountSession;
  createTeacher: CreateTeacher;
  listSchoolTeachers: ListSchoolTeachers;
  resendTeacherCredentials: ResendTeacherCredentials;
  changeTeacherPassword: ChangeTeacherPassword;
  createStaff: CreateStaff;
  listSchoolStaff: ListSchoolStaff;
  resendStaffCredentials: ResendStaffCredentials;
  changeStaffPassword: ChangeStaffPassword;
  createStudent: CreateStudent;
  listSchoolStudents: ListSchoolStudents;
  resendStudentCredentials: ResendStudentCredentials;
  changeStudentPassword: ChangeStudentPassword;
};

function readRequestId(req: IncomingMessage): string {
  const raw = req.headers["x-request-id"];
  if (typeof raw === "string" && raw.length > 0) {
    return raw;
  }

  const first = Array.isArray(raw) ? raw[0] : undefined;
  if (first !== undefined && first.length > 0) {
    return first;
  }

  return randomUUID();
}

function readHostHeader(req: IncomingMessage): string {
  const forwarded = req.headers["x-school-host"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded;
  }

  return req.headers.host ?? "";
}

function readBearerToken(req: IncomingMessage): string | undefined {
  const raw = req.headers.authorization;
  if (typeof raw === "string" && raw.startsWith("Bearer ")) {
    return raw.slice(7);
  }

  return undefined;
}

function readCampusLoginField(record: object): string {
  if ("identifier" in record && typeof record.identifier === "string") {
    return record.identifier;
  }
  if ("email" in record && typeof record.email === "string") {
    return record.email;
  }
  return "";
}

function logCompletedRequest(
  logger: LoggerPort,
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  requestId: string,
  started: bigint,
): void {
  const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
  const statusCode = res.statusCode;
  const bindings = {
    event: "http.request",
    requestId,
    method: req.method,
    path: pathname,
    statusCode,
    durationMs: Number(durationMs.toFixed(2)),
  };

  if (pathname === "/health") {
    logger.debug(bindings, "health check");
    return;
  }

  if (statusCode >= 500) {
    logger.error(bindings, "request failed");
    return;
  }

  if (statusCode >= 400) {
    logger.warn(bindings, "request rejected");
    return;
  }

  logger.info(bindings, "request completed");
}

function readAdminFeaturedSchoolId(pathname: string): string | undefined {
  const prefix = "/admin/featured-schools/";
  if (!pathname.startsWith(prefix)) {
    return undefined;
  }

  const id = pathname.slice(prefix.length);
  if (id.length === 0 || id.includes("/")) {
    return undefined;
  }

  return id;
}

export function createApp(deps: CreateAppDeps) {
  const {
    logger,
    getHealth,
    signInPlatformAdmin,
    readPlatformAdminSession,
    listPublicFeaturedSchools,
    resolvePublicHost,
    listAdminFeaturedSchools,
    createFeaturedSchool,
    updateFeaturedSchool,
    deleteFeaturedSchool,
    createTenant,
    listAdminTenants,
    getAdminDashboard,
    lookupTenantUsername,
    suspendTenant,
    reactivateTenant,
    resendTenantCredentials,
    submitContactMessage,
    listAdminContactMessages,
    actOnContactMessage,
    signInSchoolAccount,
    readSchoolAccountSession,
    changeSchoolAccountPassword,
    claimSchoolAccountUsername,
    lookupSchoolAccountUsername,
    readAppAbbreviation,
    claimAppAbbreviation,
    readSettingsAbbreviation,
    claimSettingsAbbreviation,
    signInCampusAccount,
    readCampusAccountSession,
    createTeacher,
    listSchoolTeachers,
    resendTeacherCredentials,
    changeTeacherPassword,
    createStaff,
    listSchoolStaff,
    resendStaffCredentials,
    changeStaffPassword,
    createStudent,
    listSchoolStudents,
    resendStudentCredentials,
    changeStudentPassword,
  } = deps;

  return createServer((req, res) => {
    const started = process.hrtime.bigint();
    const pathname = getPathname(req);
    const requestId = readRequestId(req);

    res.setHeader("x-request-id", requestId);
    res.on("finish", () => {
      logCompletedRequest(logger, req, res, pathname, requestId, started);
    });

    void handleRequest(req, res).catch((err: unknown) => {
      logger.error(
        { err, event: "http.unhandled", requestId, path: pathname },
        "unhandled request error",
      );

      if (!res.headersSent) {
        sendJson(res, 500, { error: "Internal server error" });
        return;
      }

      res.destroy();
    });

    async function handleRequest(
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> {
      if (request.method === "GET" && pathname === "/health") {
        const health = await getHealth();
        sendJson(response, health.ok ? 200 : 503, health);
        return;
      }

      if (pathname === "/admin/session") {
        await handleAdminSession(request, response);
        return;
      }

      if (pathname === "/school-accounts/session") {
        await handleSchoolAccountSession(request, response);
        return;
      }

      if (pathname === "/school-accounts/password") {
        await handleSchoolAccountPassword(request, response);
        return;
      }

      if (pathname === "/school-accounts/username") {
        await handleSchoolAccountUsername(request, response);
        return;
      }

      if (pathname === "/school-accounts/abbreviation") {
        await handleSchoolAccountAbbreviation(request, response);
        return;
      }

      if (pathname === "/school-settings/abbreviation") {
        await handleSchoolSettingsAbbreviation(request, response);
        return;
      }

      if (pathname === "/school-accounts/campus-session") {
        await handleCampusAccountSession(request, response);
        return;
      }

      if (pathname === "/school-teachers") {
        await handleSchoolTeachers(request, response);
        return;
      }

      if (pathname === "/school-teachers/password") {
        await handleSchoolTeacherPassword(request, response);
        return;
      }

      const teacherResendId = readSchoolTeacherResend(pathname);
      if (teacherResendId !== undefined) {
        await handleSchoolTeacherResend(request, response, teacherResendId);
        return;
      }

      if (pathname === "/school-staff") {
        await handleSchoolStaff(request, response);
        return;
      }

      if (pathname === "/school-staff/password") {
        await handleSchoolStaffPassword(request, response);
        return;
      }

      const staffResendId = readSchoolStaffResend(pathname);
      if (staffResendId !== undefined) {
        await handleSchoolStaffResend(request, response, staffResendId);
        return;
      }

      if (pathname === "/school-students") {
        await handleSchoolStudents(request, response);
        return;
      }

      if (pathname === "/school-students/password") {
        await handleSchoolStudentPassword(request, response);
        return;
      }

      const studentResendId = readSchoolStudentResend(pathname);
      if (studentResendId !== undefined) {
        await handleSchoolStudentResend(request, response, studentResendId);
        return;
      }

      if (pathname === "/public/featured-schools") {
        await handlePublicFeaturedSchools(request, response);
        return;
      }

      if (pathname === "/public/resolve") {
        await handlePublicResolve(request, response);
        return;
      }

      if (pathname === "/public/contact") {
        await handlePublicContact(request, response);
        return;
      }

      if (pathname === "/admin/contact-messages") {
        await handleAdminContactMessages(request, response);
        return;
      }

      const contactActId = readAdminContactMessageAct(pathname);
      if (contactActId !== undefined) {
        await handleAdminContactMessageAct(request, response, contactActId);
        return;
      }

      if (pathname === "/admin/featured-schools") {
        await handleAdminFeaturedSchools(request, response);
        return;
      }

      if (pathname === "/admin/dashboard") {
        await handleAdminDashboard(request, response);
        return;
      }

      if (pathname === "/admin/tenants/username") {
        await handleAdminTenantUsername(request, response);
        return;
      }

      if (pathname === "/admin/tenants") {
        await handleAdminTenants(request, response);
        return;
      }

      const tenantAction = readAdminTenantAction(pathname);
      if (tenantAction !== undefined) {
        await handleAdminTenantAction(request, response, tenantAction);
        return;
      }

      const featuredSchoolId = readAdminFeaturedSchoolId(pathname);
      if (featuredSchoolId !== undefined) {
        await handleAdminFeaturedSchoolItem(request, response, featuredSchoolId);
        return;
      }

      sendJson(response, 404, { error: "Not found" });
    }

    async function handleAdminSession(
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> {
      if (request.method === "POST") {
        let body: unknown;
        try {
          body = await readJsonBody(request);
        } catch {
          sendJson(response, 400, { error: "Invalid JSON" });
          return;
        }

        const record = body !== null && typeof body === "object" ? body : {};
        const email =
          "email" in record && typeof record.email === "string" ? record.email : "";
        const password =
          "password" in record && typeof record.password === "string"
            ? record.password
            : "";

        const result = await signInPlatformAdmin({
          email,
          password,
          hostHeader: readHostHeader(request),
        });

        if (!result.ok) {
          sendJson(response, result.status, { error: result.error });
          return;
        }

        sendJson(response, 200, result.session);
        return;
      }

      if (request.method === "GET") {
        const session = readPlatformAdminSession(readBearerToken(request));
        if (session === undefined) {
          sendJson(response, 401, { error: "Unauthorized" });
          return;
        }

        sendJson(response, 200, session);
        return;
      }

      if (request.method === "DELETE") {
        sendJson(response, 200, { ok: true });
        return;
      }

      sendJson(response, 405, { error: "Method not allowed" });
    }

    async function handleSchoolAccountSession(
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> {
      if (request.method === "POST") {
        let body: unknown;
        try {
          body = await readJsonBody(request);
        } catch {
          sendJson(response, 400, { error: "Invalid JSON" });
          return;
        }

        const record = body !== null && typeof body === "object" ? body : {};
        const email =
          "email" in record && typeof record.email === "string" ? record.email : "";
        const password =
          "password" in record && typeof record.password === "string"
            ? record.password
            : "";

        const result = await signInSchoolAccount({
          email,
          password,
          hostHeader: readHostHeader(request),
        });

        if (!result.ok) {
          sendJson(response, result.status, { error: result.error });
          return;
        }

        sendJson(response, 200, result.session);
        return;
      }

      if (request.method === "GET") {
        const result = await readSchoolAccountSession({
          token: readBearerToken(request),
          hostHeader: readHostHeader(request),
        });
        if (!result.ok) {
          sendJson(response, result.status, { error: result.error });
          return;
        }

        sendJson(response, 200, result.session);
        return;
      }

      if (request.method === "DELETE") {
        const result = await readSchoolAccountSession({
          token: readBearerToken(request),
          hostHeader: readHostHeader(request),
        });
        if (!result.ok && result.status === 403) {
          sendJson(response, result.status, { error: result.error });
          return;
        }

        sendJson(response, 200, { ok: true });
        return;
      }

      sendJson(response, 405, { error: "Method not allowed" });
    }

    async function handleSchoolAccountPassword(
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> {
      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }

      const current = await readSchoolAccountSession({
        token: readBearerToken(request),
        hostHeader: readHostHeader(request),
      });
      if (!current.ok) {
        sendJson(response, current.status, { error: current.error });
        return;
      }

      let body: unknown;
      try {
        body = await readJsonBody(request);
      } catch {
        sendJson(response, 400, { error: "Invalid JSON" });
        return;
      }

      const record = body !== null && typeof body === "object" ? body : {};
      const currentPassword =
        "currentPassword" in record && typeof record.currentPassword === "string"
          ? record.currentPassword
          : "";
      const newPassword =
        "newPassword" in record && typeof record.newPassword === "string"
          ? record.newPassword
          : "";

      const result = await changeSchoolAccountPassword({
        hostHeader: readHostHeader(request),
        accountId: current.session.accountId,
        expiresAt: current.session.expiresAt,
        currentPassword,
        newPassword,
      });
      if (!result.ok) {
        sendJson(response, result.status, { error: result.error });
        return;
      }

      sendJson(response, 200, result.session);
    }

    async function handleSchoolAccountUsername(
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> {
      const current = await readSchoolAccountSession({
        token: readBearerToken(request),
        hostHeader: readHostHeader(request),
      });
      if (!current.ok) {
        sendJson(response, current.status, { error: current.error });
        return;
      }

      if (request.method === "GET") {
        const result = await lookupSchoolAccountUsername({
          hostHeader: readHostHeader(request),
          accountId: current.session.accountId,
          slug: getRequestUrl(request).searchParams.get("slug") ?? "",
        });
        if (!result.ok) {
          sendJson(response, result.status, { error: result.error });
          return;
        }

        if (result.available) {
          sendJson(response, 200, {
            username: result.username,
            available: true,
          });
          return;
        }

        sendJson(response, 200, {
          username: result.username,
          available: false,
          reason: result.reason,
        });
        return;
      }

      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }

      let body: unknown;
      try {
        body = await readJsonBody(request);
      } catch {
        sendJson(response, 400, { error: "Invalid JSON" });
        return;
      }

      const record = body !== null && typeof body === "object" ? body : {};
      const slug =
        "slug" in record && typeof record.slug === "string" ? record.slug : "";

      const result = await claimSchoolAccountUsername({
        hostHeader: readHostHeader(request),
        accountId: current.session.accountId,
        slug,
      });
      if (!result.ok) {
        sendJson(response, result.status, { error: result.error });
        return;
      }

      sendJson(response, 200, {
        host: result.host,
        slug: result.slug,
      });
    }

    async function handleSchoolAccountAbbreviation(
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> {
      if (request.method === "GET") {
        const result = await readAppAbbreviation({
          hostHeader: readHostHeader(request),
          token: readBearerToken(request),
          code: getRequestUrl(request).searchParams.get("code") ?? "",
        });
        if (!result.ok) {
          sendJson(response, result.status, { error: result.error });
          return;
        }
        sendJson(response, 200, {
          ...result.preview,
          ...(result.lookup !== undefined ? { lookup: result.lookup } : {}),
        });
        return;
      }

      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }

      let body: unknown;
      try {
        body = await readJsonBody(request);
      } catch {
        sendJson(response, 400, { error: "Invalid JSON" });
        return;
      }

      const record = body !== null && typeof body === "object" ? body : {};
      const abbreviation =
        "abbreviation" in record && typeof record.abbreviation === "string"
          ? record.abbreviation
          : undefined;

      const result = await claimAppAbbreviation({
        hostHeader: readHostHeader(request),
        token: readBearerToken(request),
        ...(abbreviation !== undefined ? { abbreviation } : {}),
      });
      if (!result.ok) {
        sendJson(response, result.status, { error: result.error });
        return;
      }

      sendJson(response, 200, {
        abbreviation: result.abbreviation,
        host: result.host,
        slug: result.slug,
      });
    }

    async function handleSchoolSettingsAbbreviation(
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> {
      if (request.method === "GET") {
        const result = await readSettingsAbbreviation({
          hostHeader: readHostHeader(request),
          token: readBearerToken(request),
          code: getRequestUrl(request).searchParams.get("code") ?? "",
        });
        if (!result.ok) {
          sendJson(response, result.status, { error: result.error });
          return;
        }
        sendJson(response, 200, {
          ...result.preview,
          ...(result.lookup !== undefined ? { lookup: result.lookup } : {}),
        });
        return;
      }

      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }

      let body: unknown;
      try {
        body = await readJsonBody(request);
      } catch {
        sendJson(response, 400, { error: "Invalid JSON" });
        return;
      }

      const record = body !== null && typeof body === "object" ? body : {};
      const abbreviation =
        "abbreviation" in record && typeof record.abbreviation === "string"
          ? record.abbreviation
          : undefined;

      const result = await claimSettingsAbbreviation({
        hostHeader: readHostHeader(request),
        token: readBearerToken(request),
        ...(abbreviation !== undefined ? { abbreviation } : {}),
      });
      if (!result.ok) {
        sendJson(response, result.status, { error: result.error });
        return;
      }

      sendJson(response, 200, {
        abbreviation: result.abbreviation,
        locked: result.locked,
      });
    }

    async function handleCampusAccountSession(
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> {
      if (request.method === "POST") {
        let body: unknown;
        try {
          body = await readJsonBody(request);
        } catch {
          sendJson(response, 400, { error: "Invalid JSON" });
          return;
        }

        const record = body !== null && typeof body === "object" ? body : {};
        const identifier = readCampusLoginField(record);
        const password =
          "password" in record && typeof record.password === "string"
            ? record.password
            : "";

        const result = await signInCampusAccount({
          identifier,
          password,
          hostHeader: readHostHeader(request),
        });
        if (!result.ok) {
          sendJson(response, result.status, { error: result.error });
          return;
        }

        sendJson(response, 200, result.session);
        return;
      }

      if (request.method === "GET") {
        const result = await readCampusAccountSession({
          token: readBearerToken(request),
          hostHeader: readHostHeader(request),
        });
        if (!result.ok) {
          sendJson(response, result.status, { error: result.error });
          return;
        }

        sendJson(response, 200, result.session);
        return;
      }

      if (request.method === "DELETE") {
        const result = await readCampusAccountSession({
          token: readBearerToken(request),
          hostHeader: readHostHeader(request),
        });
        if (!result.ok && result.status === 403) {
          sendJson(response, result.status, { error: result.error });
          return;
        }

        sendJson(response, 200, { ok: true });
        return;
      }

      sendJson(response, 405, { error: "Method not allowed" });
    }

    async function handleSchoolTeachers(
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> {
      if (request.method === "GET") {
        const result = await listSchoolTeachers({
          hostHeader: readHostHeader(request),
          token: readBearerToken(request),
        });
        if (!result.ok) {
          sendJson(response, result.status, { error: result.error });
          return;
        }

        sendJson(response, 200, { teachers: result.teachers });
        return;
      }

      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }

      let body: unknown;
      try {
        body = await readJsonBody(request);
      } catch {
        sendJson(response, 400, { error: "Invalid JSON" });
        return;
      }

      const record = body !== null && typeof body === "object" ? body : {};
      const givenName =
        "givenName" in record && typeof record.givenName === "string"
          ? record.givenName
          : "";
      const fatherName =
        "fatherName" in record && typeof record.fatherName === "string"
          ? record.fatherName
          : "";
      const grandfatherName =
        "grandfatherName" in record && typeof record.grandfatherName === "string"
          ? record.grandfatherName
          : "";
      const sex =
        "sex" in record && typeof record.sex === "string" ? record.sex : "";
      const phone =
        "phone" in record && typeof record.phone === "string" ? record.phone : "";
      const email =
        "email" in record && typeof record.email === "string" ? record.email : "";

      const result = await createTeacher({
        hostHeader: readHostHeader(request),
        token: readBearerToken(request),
        givenName,
        fatherName,
        grandfatherName,
        sex,
        phone,
        email,
      });
      if (!result.ok) {
        sendJson(response, result.status, { error: result.error });
        return;
      }

      sendJson(response, 201, {
        teacher: result.teacher,
        credentials: result.credentials,
        emailSent: result.emailSent,
        ...(result.emailError !== undefined ? { emailError: result.emailError } : {}),
      });
    }

    async function handleSchoolTeacherPassword(
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> {
      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }

      let body: unknown;
      try {
        body = await readJsonBody(request);
      } catch {
        sendJson(response, 400, { error: "Invalid JSON" });
        return;
      }

      const record = body !== null && typeof body === "object" ? body : {};
      const password =
        "password" in record && typeof record.password === "string"
          ? record.password
          : "";

      const result = await changeTeacherPassword({
        hostHeader: readHostHeader(request),
        token: readBearerToken(request),
        password,
      });
      if (!result.ok) {
        sendJson(response, result.status, { error: result.error });
        return;
      }

      sendJson(response, 200, { teacher: result.teacher });
    }

    async function handleSchoolTeacherResend(
      request: IncomingMessage,
      response: ServerResponse,
      id: string,
    ): Promise<void> {
      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }

      const result = await resendTeacherCredentials({
        hostHeader: readHostHeader(request),
        token: readBearerToken(request),
        id,
      });
      if (!result.ok) {
        sendJson(response, result.status, { error: result.error });
        return;
      }

      sendJson(response, 200, {
        teacher: result.teacher,
        credentials: result.credentials,
        emailSent: result.emailSent,
        ...(result.emailError !== undefined ? { emailError: result.emailError } : {}),
      });
    }

    async function handleSchoolStaff(
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> {
      if (request.method === "GET") {
        const result = await listSchoolStaff({
          hostHeader: readHostHeader(request),
          token: readBearerToken(request),
        });
        if (!result.ok) {
          sendJson(response, result.status, { error: result.error });
          return;
        }

        sendJson(response, 200, { staff: result.staff });
        return;
      }

      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }

      let body: unknown;
      try {
        body = await readJsonBody(request);
      } catch {
        sendJson(response, 400, { error: "Invalid JSON" });
        return;
      }

      const record = body !== null && typeof body === "object" ? body : {};
      const givenName =
        "givenName" in record && typeof record.givenName === "string"
          ? record.givenName
          : "";
      const fatherName =
        "fatherName" in record && typeof record.fatherName === "string"
          ? record.fatherName
          : "";
      const grandfatherName =
        "grandfatherName" in record && typeof record.grandfatherName === "string"
          ? record.grandfatherName
          : "";
      const sex =
        "sex" in record && typeof record.sex === "string" ? record.sex : "";
      const phone =
        "phone" in record && typeof record.phone === "string" ? record.phone : "";
      const email =
        "email" in record && typeof record.email === "string" ? record.email : "";

      const result = await createStaff({
        hostHeader: readHostHeader(request),
        token: readBearerToken(request),
        givenName,
        fatherName,
        grandfatherName,
        sex,
        phone,
        email,
      });
      if (!result.ok) {
        sendJson(response, result.status, { error: result.error });
        return;
      }

      sendJson(response, 201, {
        staff: result.staff,
        credentials: result.credentials,
        emailSent: result.emailSent,
        ...(result.emailError !== undefined ? { emailError: result.emailError } : {}),
      });
    }

    async function handleSchoolStaffPassword(
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> {
      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }

      let body: unknown;
      try {
        body = await readJsonBody(request);
      } catch {
        sendJson(response, 400, { error: "Invalid JSON" });
        return;
      }

      const record = body !== null && typeof body === "object" ? body : {};
      const password =
        "password" in record && typeof record.password === "string"
          ? record.password
          : "";

      const result = await changeStaffPassword({
        hostHeader: readHostHeader(request),
        token: readBearerToken(request),
        password,
      });
      if (!result.ok) {
        sendJson(response, result.status, { error: result.error });
        return;
      }

      sendJson(response, 200, { staff: result.staff });
    }

    async function handleSchoolStaffResend(
      request: IncomingMessage,
      response: ServerResponse,
      id: string,
    ): Promise<void> {
      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }

      const result = await resendStaffCredentials({
        hostHeader: readHostHeader(request),
        token: readBearerToken(request),
        id,
      });
      if (!result.ok) {
        sendJson(response, result.status, { error: result.error });
        return;
      }

      sendJson(response, 200, {
        staff: result.staff,
        credentials: result.credentials,
        emailSent: result.emailSent,
        ...(result.emailError !== undefined ? { emailError: result.emailError } : {}),
      });
    }

    async function handleSchoolStudents(
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> {
      if (request.method === "GET") {
        const result = await listSchoolStudents({
          hostHeader: readHostHeader(request),
          token: readBearerToken(request),
        });
        if (!result.ok) {
          sendJson(response, result.status, { error: result.error });
          return;
        }

        sendJson(response, 200, { students: result.students });
        return;
      }

      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }

      let body: unknown;
      try {
        body = await readJsonBody(request);
      } catch {
        sendJson(response, 400, { error: "Invalid JSON" });
        return;
      }

      const record = body !== null && typeof body === "object" ? body : {};
      const givenName =
        "givenName" in record && typeof record.givenName === "string"
          ? record.givenName
          : "";
      const fatherName =
        "fatherName" in record && typeof record.fatherName === "string"
          ? record.fatherName
          : "";
      const grandfatherName =
        "grandfatherName" in record && typeof record.grandfatherName === "string"
          ? record.grandfatherName
          : "";
      const sex =
        "sex" in record && typeof record.sex === "string" ? record.sex : "";
      const phone =
        "phone" in record && typeof record.phone === "string" ? record.phone : "";
      const email =
        "email" in record && typeof record.email === "string" ? record.email : "";

      const result = await createStudent({
        hostHeader: readHostHeader(request),
        token: readBearerToken(request),
        givenName,
        fatherName,
        grandfatherName,
        sex,
        phone,
        email,
      });
      if (!result.ok) {
        sendJson(response, result.status, { error: result.error });
        return;
      }

      sendJson(response, 201, {
        student: result.student,
        credentials: result.credentials,
        emailSent: result.emailSent,
        ...(result.emailError !== undefined ? { emailError: result.emailError } : {}),
      });
    }

    async function handleSchoolStudentPassword(
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> {
      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }

      let body: unknown;
      try {
        body = await readJsonBody(request);
      } catch {
        sendJson(response, 400, { error: "Invalid JSON" });
        return;
      }

      const record = body !== null && typeof body === "object" ? body : {};
      const password =
        "password" in record && typeof record.password === "string"
          ? record.password
          : "";

      const result = await changeStudentPassword({
        hostHeader: readHostHeader(request),
        token: readBearerToken(request),
        password,
      });
      if (!result.ok) {
        sendJson(response, result.status, { error: result.error });
        return;
      }

      sendJson(response, 200, { student: result.student });
    }

    async function handleSchoolStudentResend(
      request: IncomingMessage,
      response: ServerResponse,
      id: string,
    ): Promise<void> {
      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }

      const result = await resendStudentCredentials({
        hostHeader: readHostHeader(request),
        token: readBearerToken(request),
        id,
      });
      if (!result.ok) {
        sendJson(response, result.status, { error: result.error });
        return;
      }

      sendJson(response, 200, {
        student: result.student,
        credentials: result.credentials,
        emailSent: result.emailSent,
        ...(result.emailError !== undefined ? { emailError: result.emailError } : {}),
      });
    }

    function requireAdminSession(
      request: IncomingMessage,
      response: ServerResponse,
    ): boolean {
      const session = readPlatformAdminSession(readBearerToken(request));
      if (session === undefined) {
        sendJson(response, 401, { error: "Unauthorized" });
        return false;
      }
      return true;
    }

    async function handlePublicFeaturedSchools(
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> {
      if (request.method !== "GET") {
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }

      sendJson(response, 200, await listPublicFeaturedSchools());
    }

    async function handlePublicResolve(
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> {
      if (request.method !== "GET") {
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }

      sendJson(response, 200, await resolvePublicHost(readHostHeader(request)));
    }

    async function handlePublicContact(
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> {
      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }

      let body: unknown;
      try {
        body = await readJsonBody(request);
      } catch {
        sendJson(response, 400, { error: "Invalid JSON" });
        return;
      }

      const record = body !== null && typeof body === "object" ? body : {};
      const school =
        "school" in record && typeof record.school === "string" ? record.school : "";
      const name =
        "name" in record && typeof record.name === "string" ? record.name : "";
      const email =
        "email" in record && typeof record.email === "string" ? record.email : "";
      const role =
        "role" in record && typeof record.role === "string" ? record.role : undefined;
      const note =
        "note" in record && typeof record.note === "string" ? record.note : undefined;

      const result = await submitContactMessage({
        school,
        name,
        email,
        ...(role !== undefined ? { role } : {}),
        ...(note !== undefined ? { note } : {}),
      });
      if (!result.ok) {
        sendJson(response, result.status, { error: result.error });
        return;
      }

      sendJson(response, 201, { ok: true });
    }

    async function handleAdminContactMessages(
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> {
      if (!requireAdminSession(request, response)) {
        return;
      }

      if (request.method !== "GET") {
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }

      const query = getRequestUrl(request).searchParams;
      const pageRaw = query.get("page");
      const pageSizeRaw = query.get("pageSize");
      const page = pageRaw === null ? undefined : Number(pageRaw);
      const pageSize = pageSizeRaw === null ? undefined : Number(pageSizeRaw);

      const result = await listAdminContactMessages({
        hostHeader: readHostHeader(request),
        ...(page !== undefined ? { page } : {}),
        ...(pageSize !== undefined ? { pageSize } : {}),
      });
      if (!result.ok) {
        sendJson(response, result.status, { error: result.error });
        return;
      }

      sendJson(response, 200, {
        messages: result.messages,
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        pending: result.pending,
      });
    }

    async function handleAdminContactMessageAct(
      request: IncomingMessage,
      response: ServerResponse,
      id: string,
    ): Promise<void> {
      if (!requireAdminSession(request, response)) {
        return;
      }

      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }

      const result = await actOnContactMessage({
        hostHeader: readHostHeader(request),
        id,
      });
      if (!result.ok) {
        sendJson(response, result.status, { error: result.error });
        return;
      }

      sendJson(response, 200, { message: result.message });
    }

    async function handleAdminFeaturedSchools(
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> {
      if (!requireAdminSession(request, response)) {
        return;
      }

      if (request.method === "GET") {
        const result = await listAdminFeaturedSchools({
          hostHeader: readHostHeader(request),
        });
        if (!result.ok) {
          sendJson(response, result.status, { error: result.error });
          return;
        }

        sendJson(response, 200, { schools: result.schools });
        return;
      }

      if (request.method === "POST") {
        let body: unknown;
        try {
          body = await readJsonBody(request);
        } catch {
          sendJson(response, 400, { error: "Invalid JSON" });
          return;
        }

        const record = body !== null && typeof body === "object" ? body : {};
        const name =
          "name" in record && typeof record.name === "string" ? record.name : "";
        const slug =
          "slug" in record && typeof record.slug === "string" ? record.slug : "";

        const result = await createFeaturedSchool({
          hostHeader: readHostHeader(request),
          name,
          slug,
        });
        if (!result.ok) {
          sendJson(response, result.status, { error: result.error });
          return;
        }

        sendJson(response, 201, { school: result.school });
        return;
      }

      sendJson(response, 405, { error: "Method not allowed" });
    }

    async function handleAdminFeaturedSchoolItem(
      request: IncomingMessage,
      response: ServerResponse,
      id: string,
    ): Promise<void> {
      if (!requireAdminSession(request, response)) {
        return;
      }

      if (request.method === "PATCH") {
        let body: unknown;
        try {
          body = await readJsonBody(request);
        } catch {
          sendJson(response, 400, { error: "Invalid JSON" });
          return;
        }

        const record = body !== null && typeof body === "object" ? body : {};
        const result = await updateFeaturedSchool({
          hostHeader: readHostHeader(request),
          id,
          ...readFeaturedSchoolPatch(record),
        });
        if (!result.ok) {
          sendJson(response, result.status, { error: result.error });
          return;
        }

        sendJson(response, 200, { school: result.school });
        return;
      }

      if (request.method === "DELETE") {
        const result = await deleteFeaturedSchool({
          hostHeader: readHostHeader(request),
          id,
        });
        if (!result.ok) {
          sendJson(response, result.status, { error: result.error });
          return;
        }

        sendJson(response, 200, { ok: true });
        return;
      }

      sendJson(response, 405, { error: "Method not allowed" });
    }

    async function handleAdminDashboard(
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> {
      if (!requireAdminSession(request, response)) {
        return;
      }

      if (request.method !== "GET") {
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }

      const result = await getAdminDashboard({
        hostHeader: readHostHeader(request),
      });
      if (!result.ok) {
        sendJson(response, result.status, { error: result.error });
        return;
      }

      sendJson(response, 200, {
        schoolCount: result.schoolCount,
        activeCount: result.activeCount,
        pendingSetupCount: result.pendingSetupCount,
        suspendedCount: result.suspendedCount,
        servingPercent: result.servingPercent,
        createdByYear: result.createdByYear,
        newest: result.newest,
      });
    }

    async function handleAdminTenantUsername(
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> {
      if (!requireAdminSession(request, response)) {
        return;
      }

      if (request.method !== "GET") {
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }

      const result = await lookupTenantUsername({
        hostHeader: readHostHeader(request),
        slug: getRequestUrl(request).searchParams.get("slug") ?? "",
      });
      if (!result.ok) {
        sendJson(response, result.status, { error: result.error });
        return;
      }

      if (result.available) {
        sendJson(response, 200, {
          username: result.username,
          available: true,
        });
        return;
      }

      sendJson(response, 200, {
        username: result.username,
        available: false,
        reason: result.reason,
      });
    }

    async function handleAdminTenants(
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> {
      if (!requireAdminSession(request, response)) {
        return;
      }

      if (request.method === "GET") {
        const query = getRequestUrl(request).searchParams;
        const result = await listAdminTenants({
          hostHeader: readHostHeader(request),
          page: query.get("page") ?? undefined,
          pageSize: query.get("pageSize") ?? undefined,
        });
        if (!result.ok) {
          sendJson(response, result.status, { error: result.error });
          return;
        }

        sendJson(response, 200, {
          schools: result.schools,
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
        });
        return;
      }

      if (request.method === "POST") {
        let body: unknown;
        try {
          body = await readJsonBody(request);
        } catch {
          sendJson(response, 400, { error: "Invalid JSON" });
          return;
        }

        const record = body !== null && typeof body === "object" ? body : {};
        const name =
          "name" in record && typeof record.name === "string" ? record.name : "";
        const email =
          "email" in record && typeof record.email === "string" ? record.email : "";

        const result = await createTenant({
          hostHeader: readHostHeader(request),
          name,
          email,
        });
        if (!result.ok) {
          sendJson(response, result.status, { error: result.error });
          return;
        }

        sendJson(response, 201, {
          school: result.school,
          credentials: result.credentials,
          emailSent: result.emailSent,
          ...(result.emailError !== undefined ? { emailError: result.emailError } : {}),
        });
        return;
      }

      sendJson(response, 405, { error: "Method not allowed" });
    }

    async function handleAdminTenantAction(
      request: IncomingMessage,
      response: ServerResponse,
      action: { id: string; kind: AdminTenantActionKind },
    ): Promise<void> {
      if (!requireAdminSession(request, response)) {
        return;
      }

      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }

      switch (action.kind) {
        case "suspend": {
          const result = await suspendTenant({
            hostHeader: readHostHeader(request),
            id: action.id,
          });
          if (!result.ok) {
            sendJson(response, result.status, { error: result.error });
            return;
          }
          sendJson(response, 200, { school: result.school });
          return;
        }
        case "reactivate": {
          const result = await reactivateTenant({
            hostHeader: readHostHeader(request),
            id: action.id,
          });
          if (!result.ok) {
            sendJson(response, result.status, { error: result.error });
            return;
          }
          sendJson(response, 200, { school: result.school });
          return;
        }
        case "resend-credentials": {
          const result = await resendTenantCredentials({
            hostHeader: readHostHeader(request),
            id: action.id,
          });
          if (!result.ok) {
            sendJson(response, result.status, { error: result.error });
            return;
          }
          sendJson(response, 200, {
            school: result.school,
            credentials: result.credentials,
            emailSent: result.emailSent,
            ...(result.emailError !== undefined
              ? { emailError: result.emailError }
              : {}),
          });
          return;
        }
        default: {
          const _never: never = action.kind;
          return _never;
        }
      }
    }
  });
}

function readAdminContactMessageAct(pathname: string): string | undefined {
  const prefix = "/admin/contact-messages/";
  if (!pathname.startsWith(prefix)) {
    return undefined;
  }

  const rest = pathname.slice(prefix.length);
  const suffix = "/act";
  if (!rest.endsWith(suffix)) {
    return undefined;
  }

  const id = rest.slice(0, -suffix.length);
  if (id.length === 0 || id.includes("/")) {
    return undefined;
  }

  return id;
}

function readSchoolTeacherResend(pathname: string): string | undefined {
  const prefix = "/school-teachers/";
  if (!pathname.startsWith(prefix)) {
    return undefined;
  }

  const rest = pathname.slice(prefix.length);
  const suffix = "/resend-credentials";
  if (!rest.endsWith(suffix)) {
    return undefined;
  }

  const id = rest.slice(0, -suffix.length);
  if (id.length === 0 || id.includes("/")) {
    return undefined;
  }

  return id;
}

function readSchoolStaffResend(pathname: string): string | undefined {
  const prefix = "/school-staff/";
  if (!pathname.startsWith(prefix)) {
    return undefined;
  }

  const rest = pathname.slice(prefix.length);
  const suffix = "/resend-credentials";
  if (!rest.endsWith(suffix)) {
    return undefined;
  }

  const id = rest.slice(0, -suffix.length);
  if (id.length === 0 || id.includes("/")) {
    return undefined;
  }

  return id;
}

function readSchoolStudentResend(pathname: string): string | undefined {
  const prefix = "/school-students/";
  if (!pathname.startsWith(prefix)) {
    return undefined;
  }

  const rest = pathname.slice(prefix.length);
  const suffix = "/resend-credentials";
  if (!rest.endsWith(suffix)) {
    return undefined;
  }

  const id = rest.slice(0, -suffix.length);
  if (id.length === 0 || id.includes("/")) {
    return undefined;
  }

  return id;
}

type AdminTenantActionKind = "suspend" | "reactivate" | "resend-credentials";

function readAdminTenantAction(
  pathname: string,
): { id: string; kind: AdminTenantActionKind } | undefined {
  const prefix = "/admin/tenants/";
  if (!pathname.startsWith(prefix)) {
    return undefined;
  }

  const rest = pathname.slice(prefix.length);
  const slash = rest.indexOf("/");
  if (slash <= 0) {
    return undefined;
  }

  const id = rest.slice(0, slash);
  const kind = rest.slice(slash + 1);
  if (id.length === 0 || id.includes("/")) {
    return undefined;
  }

  if (kind === "suspend" || kind === "reactivate" || kind === "resend-credentials") {
    return { id, kind };
  }

  return undefined;
}

function readFeaturedSchoolPatch(record: object): {
  name?: string;
  slug?: string;
  published?: boolean;
  sort_order?: number;
} {
  const patch: {
    name?: string;
    slug?: string;
    published?: boolean;
    sort_order?: number;
  } = {};

  if ("name" in record && typeof record.name === "string") {
    patch.name = record.name;
  }
  if ("slug" in record && typeof record.slug === "string") {
    patch.slug = record.slug;
  }
  if ("published" in record && typeof record.published === "boolean") {
    patch.published = record.published;
  }
  if ("sort_order" in record && typeof record.sort_order === "number") {
    patch.sort_order = record.sort_order;
  }

  return patch;
}
