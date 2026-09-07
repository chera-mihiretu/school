import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createAppContainer } from "./container.ts";

describe("createAppContainer", () => {
  it("resolves health, seed, and session use cases", () => {
    const container = createAppContainer({
      PORT: "5000",
      SERVICE_TAG: "backend-service",
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://school:school@127.0.0.1:5432/school",
      APP_PROTOCOL: "http",
      APP_HOST: "e-school.et:3000",
      PLATFORM_ADMIN_EMAIL: "admin@e-school.et",
      PLATFORM_ADMIN_PASSWORD: "a-sufficiently-long-secret",
      SESSION_SECRET: "test-session-secret-value",
    });

    assert.equal(typeof container.cradle.getHealth, "function");
    assert.equal(typeof container.cradle.seedFirstAdmin, "function");
    assert.equal(typeof container.cradle.signInPlatformAdmin, "function");
    assert.equal(typeof container.cradle.listPublicFeaturedSchools, "function");
    assert.equal(typeof container.cradle.resolvePublicHost, "function");
    assert.equal(typeof container.cradle.createFeaturedSchool, "function");
    assert.equal(typeof container.cradle.createTenant, "function");
    assert.equal(typeof container.cradle.listAdminTenants, "function");
    assert.equal(typeof container.cradle.suspendTenant, "function");
    assert.equal(typeof container.cradle.reactivateTenant, "function");
    assert.equal(typeof container.cradle.resendTenantCredentials, "function");
    assert.equal(typeof container.cradle.submitContactMessage, "function");
    assert.equal(typeof container.cradle.listAdminContactMessages, "function");
    assert.equal(typeof container.cradle.signInSchoolAccount, "function");
    assert.equal(typeof container.cradle.readSchoolAccountSession, "function");
    assert.equal(typeof container.cradle.changeSchoolAccountPassword, "function");
    assert.equal(typeof container.cradle.createTeacher, "function");
    assert.equal(typeof container.cradle.listSchoolTeachers, "function");
    assert.equal(typeof container.cradle.resendTeacherCredentials, "function");
    assert.equal(typeof container.cradle.changeTeacherPassword, "function");
    assert.equal(typeof container.cradle.createStaff, "function");
    assert.equal(typeof container.cradle.listSchoolStaff, "function");
    assert.equal(typeof container.cradle.resendStaffCredentials, "function");
    assert.equal(typeof container.cradle.changeStaffPassword, "function");
    assert.equal(typeof container.cradle.createStudent, "function");
    assert.equal(typeof container.cradle.listSchoolStudents, "function");
    assert.equal(typeof container.cradle.resendStudentCredentials, "function");
    assert.equal(typeof container.cradle.changeStudentPassword, "function");
    assert.equal(typeof container.cradle.signInCampusAccount, "function");
  });
});
