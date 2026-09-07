"use client";

import { useEffect } from "react";
import Link from "next/link";
import { cn } from "@/features/ui/cn";
import { useStaffStore } from "@/stores/staff-store";
import { FirstLoginError } from "@/features/school-account/first-login-ui";
import {
  listSchoolStaffAction,
  resendSchoolStaffCredentialsAction,
} from "./actions";
import { StaffCredentialsDialog } from "./credentials-sent-dialog";
import {
  canResendStaffCredentials,
  staffMailStatusCopy,
  type StaffAdminView,
} from "./school-staff";

const STAFF_ROW =
  "grid grid-cols-1 items-start gap-2 border-b border-site-line py-[19px] md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_96px_minmax(160px,auto)] md:items-center md:gap-4";

export function StaffListView({
  schoolName,
  initialStaff,
  initialListError,
}: {
  schoolName: string;
  initialStaff: StaffAdminView[];
  initialListError: string | null;
}) {
  const staff = useStaffStore((state) => state.staff);
  const hydrated = useStaffStore((state) => state.hydrated);
  const listError = useStaffStore((state) => state.listError);
  const resendPendingId = useStaffStore((state) => state.resendPendingId);
  const resendError = useStaffStore((state) => state.resendError);
  const credentials = useStaffStore((state) => state.credentials);
  const emailSent = useStaffStore((state) => state.emailSent);
  const emailError = useStaffStore((state) => state.emailError);
  const revealOpen = useStaffStore((state) => state.revealOpen);
  const hydrate = useStaffStore((state) => state.hydrate);
  const setStaff = useStaffStore((state) => state.setStaff);
  const setListError = useStaffStore((state) => state.setListError);
  const setResendPendingId = useStaffStore((state) => state.setResendPendingId);
  const setResendError = useStaffStore((state) => state.setResendError);
  const openResendDone = useStaffStore((state) => state.openResendDone);
  const dismissReveal = useStaffStore((state) => state.dismissReveal);

  useEffect(() => {
    hydrate(initialStaff);
    if (initialListError !== null) {
      setListError(initialListError);
    }
  }, [hydrate, initialListError, initialStaff, setListError]);

  useEffect(() => {
    let cancelled = false;

    async function loadStaff(): Promise<void> {
      const result = await listSchoolStaffAction();
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setStaff(result.staff);
        setListError(result.error);
        return;
      }
      setStaff(result.staff);
      setListError(null);
    }

    void loadStaff();
    return () => {
      cancelled = true;
    };
  }, [setListError, setStaff]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismissReveal();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [dismissReveal]);

  const rows = hydrated ? staff : initialStaff;

  async function submitResend(id: string): Promise<void> {
    setResendPendingId(id);
    setResendError(null);
    try {
      const result = await resendSchoolStaffCredentialsAction(id);
      if (!result.ok) {
        setResendError(result.error);
        return;
      }

      openResendDone({
        staff: result.staff,
        credentials: result.credentials,
        emailSent: result.emailSent,
        ...(result.emailError !== undefined
          ? { emailError: result.emailError }
          : {}),
      });
    } finally {
      setResendPendingId(null);
    }
  }

  return (
    <section className="w-full">
      <div className="mb-[30px] flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="m-0 text-[34px] font-medium leading-none tracking-[-0.025em]">
            Staff
          </h1>
          <p className="mt-3 m-0 max-w-[52ch] text-[15px] leading-relaxed text-site-body">
            Office staff at {schoolName}. They sign in on this campus, not on
            the app host.
          </p>
        </div>
        <Link
          href="/staff/new"
          className="inline-flex cursor-pointer items-center justify-center bg-site-brick px-5 py-3 font-mono text-[11.5px] tracking-[0.14em] uppercase text-site-on-brick no-underline hover:bg-site-brick-deep"
        >
          Add a staff member
        </Link>
      </div>

      {listError !== null ? <FirstLoginError error={listError} /> : null}
      {resendError !== null ? <FirstLoginError error={resendError} /> : null}

      <div className="hidden border-b border-site-line-strong py-3 font-mono text-[10px] tracking-[0.14em] uppercase text-site-muted md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_96px_minmax(160px,auto)] md:items-center md:gap-4">
        <div>Staff</div>
        <div>Email</div>
        <div>Mail</div>
        <div>Created</div>
        <div className="text-right">Action</div>
      </div>

      {rows.map((member) => (
        <StaffRow
          key={member.id}
          staff={member}
          resendPending={resendPendingId === member.id}
          onResend={submitResend}
        />
      ))}

      {rows.length === 0 ? (
        <div className="border-b border-site-line px-0 py-16 text-center">
          <div className="font-mono text-[12.5px] tracking-[0.04em] text-site-muted">
            No staff yet.
          </div>
          <Link
            href="/staff/new"
            className="mt-[22px] inline-flex cursor-pointer border border-site-line-strong bg-transparent px-5 py-3 font-mono text-[11px] tracking-[0.12em] uppercase text-site-ink no-underline hover:bg-site-brick hover:text-site-on-brick"
          >
            Add the first staff member
          </Link>
        </div>
      ) : null}

      <div className="mt-[18px] font-mono text-[11px] text-site-muted">
        {rows.length} {rows.length === 1 ? "staff member" : "staff"} · they sign
        in on this campus
      </div>

      <StaffCredentialsDialog
        open={revealOpen}
        credentials={credentials}
        emailSent={emailSent === true}
        emailError={emailError}
        onDismiss={dismissReveal}
      />
    </section>
  );
}

function StaffRow({
  staff,
  resendPending,
  onResend,
}: {
  staff: StaffAdminView;
  resendPending: boolean;
  onResend: (id: string) => Promise<void>;
}) {
  const schoolId = staff.employeeId;
  const created = staff.createdAt.slice(0, 10);

  return (
    <div className={STAFF_ROW}>
      <div>
        <div className="text-[16.5px] tracking-[-0.01em] text-site-ink">
          {staff.displayName}
        </div>
        {schoolId !== null ? (
          <div className="mt-1 font-mono text-[12.5px] text-site-muted">
            {schoolId}
          </div>
        ) : null}
      </div>
      <div className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[12.5px] text-site-muted">
        {staff.email}
      </div>
      <div className="font-mono text-[12px] leading-snug text-site-muted">
        {staffMailStatusCopy(staff)}
      </div>
      <div className="font-mono text-xs tabular-nums text-site-muted">
        {created}
      </div>
      <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
        {canResendStaffCredentials(staff) ? (
          <button
            type="button"
            disabled={resendPending}
            onClick={() => {
              void onResend(staff.id);
            }}
            className={cn(
              "cursor-pointer border border-site-line bg-transparent px-3 py-2 font-mono text-[11px] tracking-[0.1em] uppercase text-site-ink hover:border-site-ink disabled:cursor-not-allowed disabled:text-site-muted",
            )}
          >
            {resendPending ? "Sending…" : "Resend"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
