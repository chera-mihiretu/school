"use client";

import { useEffect } from "react";
import Link from "next/link";
import { cn } from "@/features/ui/cn";
import { useTeachersStore } from "@/stores/teachers-store";
import { FirstLoginError } from "@/features/school-account/first-login-ui";
import {
  listSchoolTeachersAction,
  resendSchoolTeacherCredentialsAction,
} from "./actions";
import { TeacherCredentialsDialog } from "./credentials-sent-dialog";
import {
  canResendTeacherCredentials,
  teacherMailStatusCopy,
  type TeacherAdminView,
} from "./school-teachers";

const TEACHER_ROW =
  "grid grid-cols-1 items-start gap-2 border-b border-site-line py-[19px] md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_96px_minmax(160px,auto)] md:items-center md:gap-4";

export function TeachersListView({
  schoolName,
  initialTeachers,
  initialListError,
}: {
  schoolName: string;
  initialTeachers: TeacherAdminView[];
  initialListError: string | null;
}) {
  const teachers = useTeachersStore((state) => state.teachers);
  const hydrated = useTeachersStore((state) => state.hydrated);
  const listError = useTeachersStore((state) => state.listError);
  const resendPendingId = useTeachersStore((state) => state.resendPendingId);
  const resendError = useTeachersStore((state) => state.resendError);
  const credentials = useTeachersStore((state) => state.credentials);
  const emailSent = useTeachersStore((state) => state.emailSent);
  const emailError = useTeachersStore((state) => state.emailError);
  const revealOpen = useTeachersStore((state) => state.revealOpen);
  const hydrate = useTeachersStore((state) => state.hydrate);
  const setTeachers = useTeachersStore((state) => state.setTeachers);
  const setListError = useTeachersStore((state) => state.setListError);
  const setResendPendingId = useTeachersStore(
    (state) => state.setResendPendingId,
  );
  const setResendError = useTeachersStore((state) => state.setResendError);
  const openResendDone = useTeachersStore((state) => state.openResendDone);
  const dismissReveal = useTeachersStore((state) => state.dismissReveal);

  useEffect(() => {
    hydrate(initialTeachers);
    if (initialListError !== null) {
      setListError(initialListError);
    }
  }, [hydrate, initialListError, initialTeachers, setListError]);

  useEffect(() => {
    let cancelled = false;

    async function loadTeachers(): Promise<void> {
      const result = await listSchoolTeachersAction();
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setTeachers(result.teachers);
        setListError(result.error);
        return;
      }
      setTeachers(result.teachers);
      setListError(null);
    }

    void loadTeachers();
    return () => {
      cancelled = true;
    };
  }, [setListError, setTeachers]);

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

  const rows = hydrated ? teachers : initialTeachers;

  async function submitResend(id: string): Promise<void> {
    setResendPendingId(id);
    setResendError(null);
    try {
      const result = await resendSchoolTeacherCredentialsAction(id);
      if (!result.ok) {
        setResendError(result.error);
        return;
      }

      openResendDone({
        teacher: result.teacher,
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
            Teachers
          </h1>
          <p className="mt-3 m-0 max-w-[52ch] text-[15px] leading-relaxed text-site-body">
            Everyone who teaches at {schoolName}. They sign in on this campus,
            not on the app host.
          </p>
        </div>
        <Link
          href="/teachers/new"
          className="inline-flex cursor-pointer items-center justify-center bg-site-brick px-5 py-3 font-mono text-[11.5px] tracking-[0.14em] uppercase text-site-on-brick no-underline hover:bg-site-brick-deep"
        >
          Add a teacher
        </Link>
      </div>

      {listError !== null ? <FirstLoginError error={listError} /> : null}
      {resendError !== null ? <FirstLoginError error={resendError} /> : null}

      <div className="hidden border-b border-site-line-strong py-3 font-mono text-[10px] tracking-[0.14em] uppercase text-site-muted md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_96px_minmax(160px,auto)] md:items-center md:gap-4">
        <div>Teacher</div>
        <div>Email</div>
        <div>Mail</div>
        <div>Created</div>
        <div className="text-right">Action</div>
      </div>

      {rows.map((teacher) => (
        <TeacherRow
          key={teacher.id}
          teacher={teacher}
          resendPending={resendPendingId === teacher.id}
          onResend={submitResend}
        />
      ))}

      {rows.length === 0 ? (
        <div className="border-b border-site-line px-0 py-16 text-center">
          <div className="font-mono text-[12.5px] tracking-[0.04em] text-site-muted">
            No teachers yet.
          </div>
          <Link
            href="/teachers/new"
            className="mt-[22px] inline-flex cursor-pointer border border-site-line-strong bg-transparent px-5 py-3 font-mono text-[11px] tracking-[0.12em] uppercase text-site-ink no-underline hover:bg-site-brick hover:text-site-on-brick"
          >
            Add the first teacher
          </Link>
        </div>
      ) : null}

      <div className="mt-[18px] font-mono text-[11px] text-site-muted">
        {rows.length} {rows.length === 1 ? "teacher" : "teachers"} · they sign
        in on this campus
      </div>

      <TeacherCredentialsDialog
        open={revealOpen}
        credentials={credentials}
        emailSent={emailSent === true}
        emailError={emailError}
        onDismiss={dismissReveal}
      />
    </section>
  );
}

function TeacherRow({
  teacher,
  resendPending,
  onResend,
}: {
  teacher: TeacherAdminView;
  resendPending: boolean;
  onResend: (id: string) => Promise<void>;
}) {
  const schoolId = teacher.employeeId;
  const created = teacher.createdAt.slice(0, 10);

  return (
    <div className={TEACHER_ROW}>
      <div>
        <div className="text-[16.5px] tracking-[-0.01em] text-site-ink">
          {teacher.displayName}
        </div>
        {schoolId !== null ? (
          <div className="mt-1 font-mono text-[12.5px] text-site-muted">
            {schoolId}
          </div>
        ) : null}
      </div>
      <div className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[12.5px] text-site-muted">
        {teacher.email}
      </div>
      <div className="font-mono text-[12px] leading-snug text-site-muted">
        {teacherMailStatusCopy(teacher)}
      </div>
      <div className="font-mono text-xs tabular-nums text-site-muted">
        {created}
      </div>
      <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
        {canResendTeacherCredentials(teacher) ? (
          <button
            type="button"
            disabled={resendPending}
            onClick={() => {
              void onResend(teacher.id);
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
