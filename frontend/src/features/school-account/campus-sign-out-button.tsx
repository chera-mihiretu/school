"use client";

import { useCampusDashboardStore } from "@/stores/campus-dashboard-store";
import { useCampusLoginStore } from "@/stores/campus-login-store";
import { useStaffStore } from "@/stores/staff-store";
import { useTeachersStore } from "@/stores/teachers-store";
import { signOutSchoolAccountAction } from "./actions";

export function CampusSignOutButton() {
  const resetLogin = useCampusLoginStore((state) => state.reset);
  const resetTeachers = useTeachersStore((state) => state.reset);
  const resetStaff = useStaffStore((state) => state.reset);
  const resetDashboard = useCampusDashboardStore((state) => state.reset);

  async function signOut(): Promise<void> {
    resetTeachers();
    resetStaff();
    resetDashboard();
    resetLogin();
    await signOutSchoolAccountAction();
  }

  return (
    <button
      type="button"
      onClick={() => {
        void signOut();
      }}
      className="cursor-pointer border-0 border-b border-site-line bg-transparent p-0 pb-0.5 font-mono text-[11px] tracking-[0.1em] uppercase text-site-muted hover:border-site-brick hover:text-site-brick"
    >
      Sign out
    </button>
  );
}
