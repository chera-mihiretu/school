"use client";

export { createAppStore } from "./create-store";
export type { AppStateCreator } from "./create-store";
export { useContactStore } from "./contact-store";
export type { ContactState } from "./contact-store";
export { useContactInboxStore } from "./contact-inbox-store";
export type { ContactInboxState } from "./contact-inbox-store";
export { useConsoleStore } from "./console-store";
export type { ConsoleState, SessionEvent } from "./console-store";
export { useCreateSchoolStore } from "./create-school-store";
export type {
  CreateSchoolCredentials,
  CreateSchoolDraftState,
} from "./create-school-store";
export { useCampusLoginStore } from "./campus-login-store";
export type { CampusLoginState } from "./campus-login-store";
export { useCampusDashboardStore } from "./campus-dashboard-store";
export type { CampusDashboardState } from "./campus-dashboard-store";
export { useTeachersStore } from "./teachers-store";
export type { TeachersState, TeachersStatus } from "./teachers-store";
export { useStaffStore } from "./staff-store";
export type { StaffState, StaffStatus } from "./staff-store";
export { useFirstLoginStore } from "./first-login-store";
export type { FirstLoginState } from "./first-login-store";
export {
  FEATURED_SCHOOLS_PATH,
  useFeaturedSchoolsStore,
} from "./featured-schools-store";
export type {
  FeaturedSchool,
  FeaturedSchoolsState,
  FeaturedSchoolsStatus,
} from "./featured-schools-store";
export { useSchoolsListStore } from "./schools-list-store";
export type {
  SchoolsListConfirm,
  SchoolsListCredentials,
  SchoolsListFilter,
  SchoolsListSort,
  SchoolsListState,
} from "./schools-list-store";
