import { asFunction, asValue, createContainer, InjectionMode } from "awilix";
import type { AwilixContainer } from "awilix";
import type { Server } from "node:http";
import {
  createActOnContactMessage,
  type ActOnContactMessage,
} from "../application/contact-messages/act-on-contact-message.ts";
import {
  createListAdminContactMessages,
  type ListAdminContactMessages,
} from "../application/contact-messages/list-admin-contact-messages.ts";
import {
  createSubmitContactMessage,
  type SubmitContactMessage,
} from "../application/contact-messages/submit-contact-message.ts";
import {
  createCreateFeaturedSchool,
  type CreateFeaturedSchool,
} from "../application/featured-schools/create-featured-school.ts";
import {
  createDeleteFeaturedSchool,
  type DeleteFeaturedSchool,
} from "../application/featured-schools/delete-featured-school.ts";
import {
  createListAdminFeaturedSchools,
  type ListAdminFeaturedSchools,
} from "../application/featured-schools/list-admin-featured-schools.ts";
import {
  createListPublicFeaturedSchools,
  type ListPublicFeaturedSchools,
} from "../application/featured-schools/list-public-featured-schools.ts";
import {
  createUpdateFeaturedSchool,
  type UpdateFeaturedSchool,
} from "../application/featured-schools/update-featured-school.ts";
import { createGetHealth, type GetHealth } from "../application/health/get-health.ts";
import {
  createChangeSchoolAccountPassword,
  type ChangeSchoolAccountPassword,
} from "../application/school-accounts/change-password.ts";
import {
  createClaimSchoolAccountUsername,
  type ClaimSchoolAccountUsername,
} from "../application/school-accounts/claim-username.ts";
import {
  createClaimAppAbbreviation,
  type ClaimAppAbbreviation,
} from "../application/school-accounts/claim-abbreviation.ts";
import {
  createLookupSchoolAccountUsername,
  type LookupSchoolAccountUsername,
} from "../application/school-accounts/lookup-username.ts";
import {
  createReadAppAbbreviation,
  type ReadAppAbbreviation,
} from "../application/school-accounts/read-abbreviation.ts";
import {
  createReadCampusAccountSession,
  type ReadCampusAccountSession,
} from "../application/school-accounts/read-campus-session.ts";
import {
  createReadSchoolAccountSession,
  type ReadSchoolAccountSession,
} from "../application/school-accounts/read-session.ts";
import {
  createChangeStaffPassword,
  type ChangeStaffPassword,
} from "../application/staff/change-staff-password.ts";
import {
  createCreateStaff,
  type CreateStaff,
} from "../application/staff/create-staff.ts";
import {
  createListSchoolStaff,
  type ListSchoolStaff,
} from "../application/staff/list-staff.ts";
import {
  createResendStaffCredentials,
  type ResendStaffCredentials,
} from "../application/staff/resend-staff-credentials.ts";
import {
  createChangeStudentPassword,
  type ChangeStudentPassword,
} from "../application/students/change-student-password.ts";
import {
  createCreateStudent,
  type CreateStudent,
} from "../application/students/create-student.ts";
import {
  createListSchoolStudents,
  type ListSchoolStudents,
} from "../application/students/list-students.ts";
import {
  createResendStudentCredentials,
  type ResendStudentCredentials,
} from "../application/students/resend-student-credentials.ts";
import {
  createChangeTeacherPassword,
  type ChangeTeacherPassword,
} from "../application/teachers/change-teacher-password.ts";
import {
  createCreateTeacher,
  type CreateTeacher,
} from "../application/teachers/create-teacher.ts";
import {
  createListSchoolTeachers,
  type ListSchoolTeachers,
} from "../application/teachers/list-teachers.ts";
import {
  createResendTeacherCredentials,
  type ResendTeacherCredentials,
} from "../application/teachers/resend-teacher-credentials.ts";
import {
  createSignInCampusAccount,
  type SignInCampusAccount,
} from "../application/school-accounts/sign-in-campus.ts";
import {
  createSignInSchoolAccount,
  type SignInSchoolAccount,
} from "../application/school-accounts/sign-in.ts";
import {
  createReadPlatformAdminSession,
  type ReadPlatformAdminSession,
} from "../application/platform-admin/read-session.ts";
import {
  createSeedFirstAdmin,
  type SeedFirstAdmin,
} from "../application/platform-admin/seed-first-admin.ts";
import {
  createSignInPlatformAdmin,
  type SignInPlatformAdmin,
} from "../application/platform-admin/sign-in.ts";
import {
  createResolvePublicHost,
  type ResolvePublicHost,
} from "../application/public-host/resolve-public-host.ts";
import {
  createClaimSettingsAbbreviation,
  type ClaimSettingsAbbreviation,
} from "../application/school-settings/claim-abbreviation.ts";
import {
  createReadSettingsAbbreviation,
  type ReadSettingsAbbreviation,
} from "../application/school-settings/read-abbreviation.ts";
import {
  createCreateTenant,
  type CreateTenant,
} from "../application/tenants/create-tenant.ts";
import {
  createGetAdminDashboard,
  type GetAdminDashboard,
} from "../application/tenants/get-admin-dashboard.ts";
import {
  createListAdminTenants,
  type ListAdminTenants,
} from "../application/tenants/list-admin-tenants.ts";
import {
  createLookupTenantUsername,
  type LookupTenantUsername,
} from "../application/tenants/lookup-tenant-username.ts";
import {
  createResendTenantCredentials,
  type ResendTenantCredentials,
} from "../application/tenants/resend-tenant-credentials.ts";
import {
  createReactivateTenant,
  createSuspendTenant,
  type SetTenantStatus,
} from "../application/tenants/set-tenant-status.ts";
import type { ContactMessageStorePort } from "../domain/ports/contact-message-store-port.ts";
import type { DatabasePort } from "../domain/ports/database-port.ts";
import type { FeaturedSchoolStorePort } from "../domain/ports/featured-school-store-port.ts";
import type { LoggerPort } from "../domain/ports/logger-port.ts";
import type { MailerPort } from "../domain/ports/mailer-port.ts";
import type { PasswordGeneratorPort } from "../domain/ports/password-generator-port.ts";
import type { PasswordHasherPort } from "../domain/ports/password-hasher-port.ts";
import type { PlatformAdminStorePort } from "../domain/ports/platform-admin-store-port.ts";
import type { TenantDirectoryPort } from "../domain/ports/tenant-directory-port.ts";
import type { StaffStorePort } from "../domain/ports/staff-store-port.ts";
import type { StudentStorePort } from "../domain/ports/student-store-port.ts";
import type { TeacherStorePort } from "../domain/ports/teacher-store-port.ts";
import type { TenantStorePort } from "../domain/ports/tenant-store-port.ts";
import { createArgon2PasswordHasher } from "../infrastructure/auth/argon2-hasher.ts";
import { createHmacSchoolSessionSigner } from "../infrastructure/auth/hmac-school-session.ts";
import { createHmacSessionSigner } from "../infrastructure/auth/hmac-session.ts";
import { createCryptoPasswordGenerator } from "../infrastructure/auth/random-password.ts";
import { createStoredCredentials } from "../infrastructure/auth/stored-credentials.ts";
import { loadConfig, type AppConfig } from "../infrastructure/config/config.ts";
import { createPublicUrlPort } from "../infrastructure/config/public-url.ts";
import { createSmtpMailer } from "../infrastructure/mail/smtp-mailer.ts";
import { createLogger } from "../infrastructure/logging/logger.ts";
import {
  createPersistence,
  type Persistence,
} from "../infrastructure/persistence/postgres.ts";
import { createApp } from "../interfaces/http/create-app.ts";

export type AppCradle = {
  config: AppConfig;
  logger: LoggerPort;
  persistence: Persistence;
  database: DatabasePort;
  platformAdminStore: PlatformAdminStorePort;
  featuredSchoolStore: FeaturedSchoolStorePort;
  tenantStore: TenantStorePort;
  teacherStore: TeacherStorePort;
  staffStore: StaffStorePort;
  studentStore: StudentStorePort;
  contactMessageStore: ContactMessageStorePort;
  tenantDirectory: TenantDirectoryPort;
  passwordHasher: PasswordHasherPort;
  passwordGenerator: PasswordGeneratorPort;
  mailer: MailerPort;
  getHealth: GetHealth;
  seedFirstAdmin: SeedFirstAdmin;
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
  httpServer: Server;
};

export function createAppContainer(
  env: NodeJS.ProcessEnv = process.env,
): AwilixContainer<AppCradle> {
  const container = createContainer<AppCradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  container.register({
    config: asValue(loadConfig(env)),
    logger: asFunction(({ config }) =>
      createLogger({ service: config.serviceName }),
    ).singleton(),
    persistence: asFunction(({ config }) => createPersistence(config.database))
      .singleton()
      .disposer((persistence) => persistence.database.close()),
    database: asFunction(({ persistence }) => persistence.database).singleton(),
    platformAdminStore: asFunction(
      ({ persistence }) => persistence.platformAdminStore,
    ).singleton(),
    featuredSchoolStore: asFunction(
      ({ persistence }) => persistence.featuredSchoolStore,
    ).singleton(),
    tenantStore: asFunction(({ persistence }) => persistence.tenantStore).singleton(),
    teacherStore: asFunction(({ persistence }) => persistence.teacherStore).singleton(),
    staffStore: asFunction(({ persistence }) => persistence.staffStore).singleton(),
    studentStore: asFunction(({ persistence }) => persistence.studentStore).singleton(),
    contactMessageStore: asFunction(
      ({ persistence }) => persistence.contactMessageStore,
    ).singleton(),
    tenantDirectory: asFunction(({ tenantStore }) => ({
      async findBySlug(slug: string) {
        const tenant = await tenantStore.findBySlug(slug);
        if (tenant === undefined) {
          return undefined;
        }
        if (tenant.slug === null) {
          return undefined;
        }
        return {
          name: tenant.name,
          slug: tenant.slug,
          status: tenant.status,
          founded: tenant.founded,
        };
      },
    })).singleton(),
    passwordHasher: asFunction(() => createArgon2PasswordHasher()).singleton(),
    passwordGenerator: asFunction(() => createCryptoPasswordGenerator()).singleton(),
    mailer: asFunction(({ config }) => createSmtpMailer(config.mail)).singleton(),
    getHealth: asFunction(({ config, database }) =>
      createGetHealth(config.serviceName, database),
    ).singleton(),
    seedFirstAdmin: asFunction(({ platformAdminStore, passwordHasher }) =>
      createSeedFirstAdmin({
        store: platformAdminStore,
        hasher: passwordHasher,
      }),
    ).singleton(),
    signInPlatformAdmin: asFunction(
      ({ config, platformAdminStore, passwordHasher }) =>
        createSignInPlatformAdmin({
          rootHost: config.auth.rootHost,
          credentials: createStoredCredentials({
            store: platformAdminStore,
            hasher: passwordHasher,
          }),
          sessions: createHmacSessionSigner({
            secret: config.auth.sessionSecret,
            ttlSeconds: config.auth.sessionTtlSeconds,
          }),
        }),
    ).singleton(),
    readPlatformAdminSession: asFunction(({ config }) =>
      createReadPlatformAdminSession(
        createHmacSessionSigner({
          secret: config.auth.sessionSecret,
          ttlSeconds: config.auth.sessionTtlSeconds,
        }),
      ),
    ).singleton(),
    listPublicFeaturedSchools: asFunction(({ config, featuredSchoolStore }) =>
      createListPublicFeaturedSchools({
        rootHost: config.auth.rootHost,
        store: featuredSchoolStore,
      }),
    ).singleton(),
    resolvePublicHost: asFunction(({ config, tenantDirectory }) =>
      createResolvePublicHost({
        rootHost: config.auth.rootHost,
        tenants: tenantDirectory,
      }),
    ).singleton(),
    listAdminFeaturedSchools: asFunction(({ config, featuredSchoolStore }) =>
      createListAdminFeaturedSchools({
        rootHost: config.auth.rootHost,
        store: featuredSchoolStore,
      }),
    ).singleton(),
    createFeaturedSchool: asFunction(({ config, featuredSchoolStore }) =>
      createCreateFeaturedSchool({
        rootHost: config.auth.rootHost,
        store: featuredSchoolStore,
      }),
    ).singleton(),
    updateFeaturedSchool: asFunction(({ config, featuredSchoolStore }) =>
      createUpdateFeaturedSchool({
        rootHost: config.auth.rootHost,
        store: featuredSchoolStore,
      }),
    ).singleton(),
    deleteFeaturedSchool: asFunction(({ config, featuredSchoolStore }) =>
      createDeleteFeaturedSchool({
        rootHost: config.auth.rootHost,
        store: featuredSchoolStore,
      }),
    ).singleton(),
    createTenant: asFunction(
      ({ config, tenantStore, passwordHasher, mailer, passwordGenerator }) =>
        createCreateTenant({
          rootHost: config.auth.rootHost,
          adminEmail: config.auth.platformAdminEmail,
          publicUrls: createPublicUrlPort({
            protocol: config.auth.protocol,
            host: config.auth.publicHost,
          }),
          store: tenantStore,
          hasher: passwordHasher,
          mailer,
          passwords: passwordGenerator,
        }),
    ).singleton(),
    listAdminTenants: asFunction(({ config, tenantStore }) =>
      createListAdminTenants({
        rootHost: config.auth.rootHost,
        store: tenantStore,
      }),
    ).singleton(),
    getAdminDashboard: asFunction(({ config, tenantStore }) =>
      createGetAdminDashboard({
        rootHost: config.auth.rootHost,
        store: tenantStore,
      }),
    ).singleton(),
    lookupTenantUsername: asFunction(({ config, tenantStore }) =>
      createLookupTenantUsername({
        rootHost: config.auth.rootHost,
        store: tenantStore,
      }),
    ).singleton(),
    suspendTenant: asFunction(({ config, tenantStore }) =>
      createSuspendTenant({
        rootHost: config.auth.rootHost,
        store: tenantStore,
      }),
    ).singleton(),
    reactivateTenant: asFunction(({ config, tenantStore }) =>
      createReactivateTenant({
        rootHost: config.auth.rootHost,
        store: tenantStore,
      }),
    ).singleton(),
    resendTenantCredentials: asFunction(
      ({ config, tenantStore, passwordHasher, mailer, passwordGenerator }) =>
        createResendTenantCredentials({
          rootHost: config.auth.rootHost,
          publicUrls: createPublicUrlPort({
            protocol: config.auth.protocol,
            host: config.auth.publicHost,
          }),
          store: tenantStore,
          hasher: passwordHasher,
          mailer,
          passwords: passwordGenerator,
        }),
    ).singleton(),
    submitContactMessage: asFunction(({ contactMessageStore }) =>
      createSubmitContactMessage({
        store: contactMessageStore,
      }),
    ).singleton(),
    listAdminContactMessages: asFunction(({ config, contactMessageStore }) =>
      createListAdminContactMessages({
        rootHost: config.auth.rootHost,
        store: contactMessageStore,
      }),
    ).singleton(),
    actOnContactMessage: asFunction(({ config, contactMessageStore }) =>
      createActOnContactMessage({
        rootHost: config.auth.rootHost,
        store: contactMessageStore,
      }),
    ).singleton(),
    signInSchoolAccount: asFunction(({ config, tenantStore, passwordHasher }) =>
      createSignInSchoolAccount({
        rootHost: config.auth.rootHost,
        store: tenantStore,
        hasher: passwordHasher,
        sessions: createHmacSchoolSessionSigner({
          secret: config.auth.sessionSecret,
          ttlSeconds: config.auth.sessionTtlSeconds,
        }),
      }),
    ).singleton(),
    readSchoolAccountSession: asFunction(({ config, tenantStore }) =>
      createReadSchoolAccountSession({
        rootHost: config.auth.rootHost,
        store: tenantStore,
        sessions: createHmacSchoolSessionSigner({
          secret: config.auth.sessionSecret,
          ttlSeconds: config.auth.sessionTtlSeconds,
        }),
      }),
    ).singleton(),
    changeSchoolAccountPassword: asFunction(({ config, tenantStore, passwordHasher }) =>
      createChangeSchoolAccountPassword({
        rootHost: config.auth.rootHost,
        store: tenantStore,
        hasher: passwordHasher,
      }),
    ).singleton(),
    claimSchoolAccountUsername: asFunction(({ config, tenantStore }) =>
      createClaimSchoolAccountUsername({
        rootHost: config.auth.rootHost,
        store: tenantStore,
      }),
    ).singleton(),
    lookupSchoolAccountUsername: asFunction(({ config, tenantStore }) =>
      createLookupSchoolAccountUsername({
        rootHost: config.auth.rootHost,
        store: tenantStore,
      }),
    ).singleton(),
    readAppAbbreviation: asFunction(({ config, tenantStore }) =>
      createReadAppAbbreviation({
        rootHost: config.auth.rootHost,
        tenants: tenantStore,
        sessions: createHmacSchoolSessionSigner({
          secret: config.auth.sessionSecret,
          ttlSeconds: config.auth.sessionTtlSeconds,
        }),
      }),
    ).singleton(),
    claimAppAbbreviation: asFunction(({ config, tenantStore }) =>
      createClaimAppAbbreviation({
        rootHost: config.auth.rootHost,
        tenants: tenantStore,
        sessions: createHmacSchoolSessionSigner({
          secret: config.auth.sessionSecret,
          ttlSeconds: config.auth.sessionTtlSeconds,
        }),
      }),
    ).singleton(),
    readSettingsAbbreviation: asFunction(({ config, tenantStore }) =>
      createReadSettingsAbbreviation({
        rootHost: config.auth.rootHost,
        tenants: tenantStore,
        sessions: createHmacSchoolSessionSigner({
          secret: config.auth.sessionSecret,
          ttlSeconds: config.auth.sessionTtlSeconds,
        }),
      }),
    ).singleton(),
    claimSettingsAbbreviation: asFunction(({ config, tenantStore }) =>
      createClaimSettingsAbbreviation({
        rootHost: config.auth.rootHost,
        tenants: tenantStore,
        sessions: createHmacSchoolSessionSigner({
          secret: config.auth.sessionSecret,
          ttlSeconds: config.auth.sessionTtlSeconds,
        }),
      }),
    ).singleton(),
    signInCampusAccount: asFunction(({ config, tenantStore, teacherStore, staffStore, studentStore, passwordHasher }) =>
      createSignInCampusAccount({
        rootHost: config.auth.rootHost,
        store: tenantStore,
        teachers: teacherStore,
        staffs: staffStore,
        students: studentStore,
        hasher: passwordHasher,
        sessions: createHmacSchoolSessionSigner({
          secret: config.auth.sessionSecret,
          ttlSeconds: config.auth.sessionTtlSeconds,
        }),
      }),
    ).singleton(),
    readCampusAccountSession: asFunction(({ config, tenantStore, teacherStore, staffStore, studentStore }) =>
      createReadCampusAccountSession({
        rootHost: config.auth.rootHost,
        store: tenantStore,
        teachers: teacherStore,
        staffs: staffStore,
        students: studentStore,
        sessions: createHmacSchoolSessionSigner({
          secret: config.auth.sessionSecret,
          ttlSeconds: config.auth.sessionTtlSeconds,
        }),
      }),
    ).singleton(),
    createTeacher: asFunction(
      ({ config, tenantStore, teacherStore, staffStore, studentStore, passwordHasher, mailer, passwordGenerator }) =>
        createCreateTeacher({
          rootHost: config.auth.rootHost,
          adminEmail: config.auth.platformAdminEmail,
          publicUrls: createPublicUrlPort({
            protocol: config.auth.protocol,
            host: config.auth.publicHost,
          }),
          tenants: tenantStore,
          teachers: teacherStore,
          staffs: staffStore,
          students: studentStore,
          hasher: passwordHasher,
          mailer,
          passwords: passwordGenerator,
          sessions: createHmacSchoolSessionSigner({
            secret: config.auth.sessionSecret,
            ttlSeconds: config.auth.sessionTtlSeconds,
          }),
        }),
    ).singleton(),
    listSchoolTeachers: asFunction(({ config, tenantStore, teacherStore }) =>
      createListSchoolTeachers({
        rootHost: config.auth.rootHost,
        tenants: tenantStore,
        teachers: teacherStore,
        sessions: createHmacSchoolSessionSigner({
          secret: config.auth.sessionSecret,
          ttlSeconds: config.auth.sessionTtlSeconds,
        }),
      }),
    ).singleton(),
    resendTeacherCredentials: asFunction(
      ({ config, tenantStore, teacherStore, passwordHasher, mailer, passwordGenerator }) =>
        createResendTeacherCredentials({
          rootHost: config.auth.rootHost,
          publicUrls: createPublicUrlPort({
            protocol: config.auth.protocol,
            host: config.auth.publicHost,
          }),
          tenants: tenantStore,
          teachers: teacherStore,
          hasher: passwordHasher,
          mailer,
          passwords: passwordGenerator,
          sessions: createHmacSchoolSessionSigner({
            secret: config.auth.sessionSecret,
            ttlSeconds: config.auth.sessionTtlSeconds,
          }),
        }),
    ).singleton(),
    changeTeacherPassword: asFunction(({ config, tenantStore, teacherStore, passwordHasher }) =>
      createChangeTeacherPassword({
        rootHost: config.auth.rootHost,
        tenants: tenantStore,
        teachers: teacherStore,
        hasher: passwordHasher,
        sessions: createHmacSchoolSessionSigner({
          secret: config.auth.sessionSecret,
          ttlSeconds: config.auth.sessionTtlSeconds,
        }),
      }),
    ).singleton(),
    createStaff: asFunction(
      ({ config, tenantStore, staffStore, teacherStore, studentStore, passwordHasher, mailer, passwordGenerator }) =>
        createCreateStaff({
          rootHost: config.auth.rootHost,
          adminEmail: config.auth.platformAdminEmail,
          publicUrls: createPublicUrlPort({
            protocol: config.auth.protocol,
            host: config.auth.publicHost,
          }),
          tenants: tenantStore,
          staffs: staffStore,
          teachers: teacherStore,
          students: studentStore,
          hasher: passwordHasher,
          mailer,
          passwords: passwordGenerator,
          sessions: createHmacSchoolSessionSigner({
            secret: config.auth.sessionSecret,
            ttlSeconds: config.auth.sessionTtlSeconds,
          }),
        }),
    ).singleton(),
    listSchoolStaff: asFunction(({ config, tenantStore, staffStore }) =>
      createListSchoolStaff({
        rootHost: config.auth.rootHost,
        tenants: tenantStore,
        staffs: staffStore,
        sessions: createHmacSchoolSessionSigner({
          secret: config.auth.sessionSecret,
          ttlSeconds: config.auth.sessionTtlSeconds,
        }),
      }),
    ).singleton(),
    resendStaffCredentials: asFunction(
      ({ config, tenantStore, staffStore, passwordHasher, mailer, passwordGenerator }) =>
        createResendStaffCredentials({
          rootHost: config.auth.rootHost,
          publicUrls: createPublicUrlPort({
            protocol: config.auth.protocol,
            host: config.auth.publicHost,
          }),
          tenants: tenantStore,
          staffs: staffStore,
          hasher: passwordHasher,
          mailer,
          passwords: passwordGenerator,
          sessions: createHmacSchoolSessionSigner({
            secret: config.auth.sessionSecret,
            ttlSeconds: config.auth.sessionTtlSeconds,
          }),
        }),
    ).singleton(),
    changeStaffPassword: asFunction(({ config, tenantStore, staffStore, passwordHasher }) =>
      createChangeStaffPassword({
        rootHost: config.auth.rootHost,
        tenants: tenantStore,
        staffs: staffStore,
        hasher: passwordHasher,
        sessions: createHmacSchoolSessionSigner({
          secret: config.auth.sessionSecret,
          ttlSeconds: config.auth.sessionTtlSeconds,
        }),
      }),
    ).singleton(),
    createStudent: asFunction(
      ({ config, tenantStore, studentStore, staffStore, teacherStore, passwordHasher, mailer, passwordGenerator }) =>
        createCreateStudent({
          rootHost: config.auth.rootHost,
          adminEmail: config.auth.platformAdminEmail,
          publicUrls: createPublicUrlPort({
            protocol: config.auth.protocol,
            host: config.auth.publicHost,
          }),
          tenants: tenantStore,
          students: studentStore,
          staffs: staffStore,
          teachers: teacherStore,
          hasher: passwordHasher,
          mailer,
          passwords: passwordGenerator,
          sessions: createHmacSchoolSessionSigner({
            secret: config.auth.sessionSecret,
            ttlSeconds: config.auth.sessionTtlSeconds,
          }),
        }),
    ).singleton(),
    listSchoolStudents: asFunction(({ config, tenantStore, studentStore }) =>
      createListSchoolStudents({
        rootHost: config.auth.rootHost,
        tenants: tenantStore,
        students: studentStore,
        sessions: createHmacSchoolSessionSigner({
          secret: config.auth.sessionSecret,
          ttlSeconds: config.auth.sessionTtlSeconds,
        }),
      }),
    ).singleton(),
    resendStudentCredentials: asFunction(
      ({ config, tenantStore, studentStore, passwordHasher, mailer, passwordGenerator }) =>
        createResendStudentCredentials({
          rootHost: config.auth.rootHost,
          publicUrls: createPublicUrlPort({
            protocol: config.auth.protocol,
            host: config.auth.publicHost,
          }),
          tenants: tenantStore,
          students: studentStore,
          hasher: passwordHasher,
          mailer,
          passwords: passwordGenerator,
          sessions: createHmacSchoolSessionSigner({
            secret: config.auth.sessionSecret,
            ttlSeconds: config.auth.sessionTtlSeconds,
          }),
        }),
    ).singleton(),
    changeStudentPassword: asFunction(({ config, tenantStore, studentStore, passwordHasher }) =>
      createChangeStudentPassword({
        rootHost: config.auth.rootHost,
        tenants: tenantStore,
        students: studentStore,
        hasher: passwordHasher,
        sessions: createHmacSchoolSessionSigner({
          secret: config.auth.sessionSecret,
          ttlSeconds: config.auth.sessionTtlSeconds,
        }),
      }),
    ).singleton(),
    httpServer: asFunction(
      ({
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
      }) =>
        createApp({
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
        }),
    ).singleton(),
  });

  return container;
}
