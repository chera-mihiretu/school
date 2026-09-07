import postgres from "postgres";
import type { ContactMessageStorePort } from "../../domain/ports/contact-message-store-port.ts";
import type { DatabasePort } from "../../domain/ports/database-port.ts";
import type { FeaturedSchoolStorePort } from "../../domain/ports/featured-school-store-port.ts";
import type { PlatformAdminStorePort } from "../../domain/ports/platform-admin-store-port.ts";
import type { StaffStorePort } from "../../domain/ports/staff-store-port.ts";
import type { StudentStorePort } from "../../domain/ports/student-store-port.ts";
import type { TeacherStorePort } from "../../domain/ports/teacher-store-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import type { DatabaseSettings } from "../config/database-url.ts";
import { createContactMessageStore } from "./contact-message-store.ts";
import { createFeaturedSchoolStore } from "./featured-school-store.ts";
import { createPlatformAdminStore } from "./platform-admin-store.ts";
import { createStaffStore } from "./staff-store.ts";
import { createStudentStore } from "./student-store.ts";
import { createTeacherStore } from "./teacher-store.ts";
import { createTenantStore } from "./tenant-store.ts";

export type Persistence = {
  database: DatabasePort;
  platformAdminStore: PlatformAdminStorePort;
  featuredSchoolStore: FeaturedSchoolStorePort;
  tenantStore: TenantStorePort;
  teacherStore: TeacherStorePort;
  staffStore: StaffStorePort;
  studentStore: StudentStorePort;
  contactMessageStore: ContactMessageStorePort;
};

export function createPersistence(settings: DatabaseSettings): Persistence {
  const sql = postgres(settings.url, {
    ssl: settings.ssl === "require" ? "require" : false,
    prepare: settings.prepare,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return {
    database: {
      async ping() {
        await sql`select 1`;
      },
      async close() {
        await sql.end({ timeout: 5 });
      },
    },
    platformAdminStore: createPlatformAdminStore(sql),
    featuredSchoolStore: createFeaturedSchoolStore(sql),
    tenantStore: createTenantStore(sql),
    teacherStore: createTeacherStore(sql),
    staffStore: createStaffStore(sql),
    studentStore: createStudentStore(sql),
    contactMessageStore: createContactMessageStore(sql),
  };
}
