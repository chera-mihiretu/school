"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTeachersStore } from "@/stores/teachers-store";
import {
  FirstLoginError,
  FirstLoginFieldLabel,
  FirstLoginGhostButton,
  FirstLoginKicker,
  FirstLoginPrimaryButton,
  FirstLoginRadio,
  FirstLoginTextInput,
} from "@/features/school-account/first-login-ui";
import {
  createSchoolTeacherAction,
  resendSchoolTeacherCredentialsAction,
} from "./actions";
import { TeacherCredentialsDialog } from "./credentials-sent-dialog";
import {
  teacherMailStatusCopy,
  teacherSexLabel,
  validateTeacherDraft,
  type TeacherSex,
} from "./school-teachers";

export function CreateTeacherView({ schoolName }: { schoolName: string }) {
  const router = useRouter();
  const teachers = useTeachersStore((state) => state.teachers);
  const error = useTeachersStore((state) => state.error);
  const givenName = useTeachersStore((state) => state.givenName);
  const fatherName = useTeachersStore((state) => state.fatherName);
  const grandfatherName = useTeachersStore((state) => state.grandfatherName);
  const sex = useTeachersStore((state) => state.sex);
  const phone = useTeachersStore((state) => state.phone);
  const email = useTeachersStore((state) => state.email);
  const pending = useTeachersStore((state) => state.pending);
  const resendPendingId = useTeachersStore((state) => state.resendPendingId);
  const resendError = useTeachersStore((state) => state.resendError);
  const credentials = useTeachersStore((state) => state.credentials);
  const emailSent = useTeachersStore((state) => state.emailSent);
  const emailError = useTeachersStore((state) => state.emailError);
  const revealOpen = useTeachersStore((state) => state.revealOpen);
  const setGivenName = useTeachersStore((state) => state.setGivenName);
  const setFatherName = useTeachersStore((state) => state.setFatherName);
  const setGrandfatherName = useTeachersStore(
    (state) => state.setGrandfatherName,
  );
  const setSex = useTeachersStore((state) => state.setSex);
  const setPhone = useTeachersStore((state) => state.setPhone);
  const setEmail = useTeachersStore((state) => state.setEmail);
  const setError = useTeachersStore((state) => state.setError);
  const setPending = useTeachersStore((state) => state.setPending);
  const setResendPendingId = useTeachersStore(
    (state) => state.setResendPendingId,
  );
  const setResendError = useTeachersStore((state) => state.setResendError);
  const reveal = useTeachersStore((state) => state.reveal);
  const openResendDone = useTeachersStore((state) => state.openResendDone);
  const dismissReveal = useTeachersStore((state) => state.dismissReveal);
  const resetDraft = useTeachersStore((state) => state.resetDraft);

  useEffect(() => {
    return () => {
      resetDraft();
    };
  }, [resetDraft]);

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

  const created =
    credentials === null
      ? undefined
      : teachers.find((teacher) => teacher.email === credentials.email);

  async function submitCreate(): Promise<void> {
    const invalid = validateTeacherDraft({
      givenName,
      fatherName,
      grandfatherName,
      sex,
      phone,
      email,
    });
    if (invalid !== undefined) {
      setError(invalid);
      return;
    }

    setPending(true);
    try {
      const result = await createSchoolTeacherAction({
        givenName,
        fatherName,
        grandfatherName,
        sex,
        phone,
        email,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }

      reveal({
        teacher: result.teacher,
        credentials: result.credentials,
        emailSent: result.emailSent,
        ...(result.emailError !== undefined
          ? { emailError: result.emailError }
          : {}),
      });
    } finally {
      setPending(false);
    }
  }

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

  if (credentials !== null) {
    return (
      <section className="w-full">
        <Link
          href="/teachers"
          className="mb-[26px] inline-block font-mono text-[11px] tracking-[0.1em] uppercase text-site-muted no-underline hover:text-site-brick"
        >
          ← Teachers
        </Link>
        <h1 className="mb-4 max-w-[16ch] text-[clamp(36px,5vw,56px)] font-light leading-[1.05] tracking-[-0.03em]">
          Teacher created
        </h1>
        <p className="mb-8 max-w-[46ch] text-[17.5px] leading-[1.65] text-site-body">
          The credentials were shown in the dialog. Use Resend if they need
          another email.
        </p>
        {created !== undefined ? (
          <p className="mb-8 font-mono text-[12.5px] leading-relaxed text-site-muted">
            Mail: {teacherMailStatusCopy(created)}
          </p>
        ) : null}
        {resendError !== null ? <FirstLoginError error={resendError} /> : null}
        <div className="mt-9 flex flex-wrap gap-3">
          <FirstLoginPrimaryButton
            type="button"
            onClick={() => router.push("/teachers")}
          >
            Back to teachers
          </FirstLoginPrimaryButton>
          <FirstLoginGhostButton
            type="button"
            disabled={resendPendingId !== null || created === undefined}
            onClick={() => {
              if (created === undefined) {
                return;
              }
              void submitResend(created.id);
            }}
          >
            {resendPendingId !== null ? "Sending…" : "Resend credentials"}
          </FirstLoginGhostButton>
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

  return (
    <section className="w-full">
      <Link
        href="/teachers"
        className="mb-[26px] inline-block font-mono text-[11px] tracking-[0.1em] uppercase text-site-muted no-underline hover:text-site-brick"
      >
        ← Teachers
      </Link>
      <FirstLoginKicker className="mb-[22px]">Add</FirstLoginKicker>
      <h1 className="mb-4 max-w-[16ch] text-[clamp(36px,5vw,56px)] font-light leading-[1.05] tracking-[-0.03em]">
        Add a teacher
      </h1>
      <p className="mb-12 max-w-[42ch] text-[17.5px] leading-[1.65] text-site-body">
        Create a teacher for {schoolName}. They sign in on this campus, not on
        the app host.
      </p>

      <form
        className="flex w-full max-w-[36rem] flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          void submitCreate();
        }}
      >
        <FirstLoginFieldLabel htmlFor="teacher-given-name">
          Given name
        </FirstLoginFieldLabel>
        <FirstLoginTextInput
          id="teacher-given-name"
          name="givenName"
          autoComplete="given-name"
          required
          value={givenName}
          onChange={(event) => setGivenName(event.target.value)}
          disabled={pending}
          placeholder="Abebe"
          className="mb-8"
        />

        <FirstLoginFieldLabel htmlFor="teacher-father-name">
          Father’s name
        </FirstLoginFieldLabel>
        <FirstLoginTextInput
          id="teacher-father-name"
          name="fatherName"
          required
          value={fatherName}
          onChange={(event) => setFatherName(event.target.value)}
          disabled={pending}
          placeholder="Kebede"
          className="mb-8"
        />

        <FirstLoginFieldLabel htmlFor="teacher-grandfather-name">
          Grandfather’s name
        </FirstLoginFieldLabel>
        <FirstLoginTextInput
          id="teacher-grandfather-name"
          name="grandfatherName"
          required
          value={grandfatherName}
          onChange={(event) => setGrandfatherName(event.target.value)}
          disabled={pending}
          placeholder="Tesfaye"
          className="mb-8"
        />

        <fieldset className="mb-8 border-0 p-0">
          <legend className="mb-3 px-0 font-mono text-[12px] tracking-[0.1em] uppercase text-site-ink">
            Sex
          </legend>
          <div className="flex gap-8">
            <SexRadio
              value="male"
              checked={sex === "male"}
              disabled={pending}
              onChange={setSex}
            />
            <SexRadio
              value="female"
              checked={sex === "female"}
              disabled={pending}
              onChange={setSex}
            />
          </div>
        </fieldset>

        <FirstLoginFieldLabel htmlFor="teacher-phone">
          Mobile
        </FirstLoginFieldLabel>
        <div className="mb-2 flex items-center gap-3">
          <span className="font-mono text-[13px] tracking-[0.04em] text-site-muted">
            +251
          </span>
          <FirstLoginTextInput
            id="teacher-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={pending}
            placeholder="09… or 07…"
          />
        </div>
        <p className="mb-8 font-mono text-[12px] leading-relaxed text-site-muted">
          Ethiopia only. Type the local number starting with 09 or 07.
        </p>

        <FirstLoginFieldLabel htmlFor="teacher-email">Email</FirstLoginFieldLabel>
        <FirstLoginTextInput
          id="teacher-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={pending}
          placeholder="teacher@school.et"
          className="mb-8"
        />

        {error !== null && error.includes("Settings") ? (
          <p className="mb-4 font-mono text-[12.5px] text-site-muted">
            Set the three-letter school code in{" "}
            <Link href="/settings" className="text-site-brick">
              Settings
            </Link>{" "}
            first.
          </p>
        ) : null}

        <FirstLoginError error={error} />
        <div className="mt-10 flex flex-wrap gap-3">
          <FirstLoginPrimaryButton
            type="submit"
            disabled={pending}
            className={pending ? "disabled:cursor-wait" : undefined}
          >
            {pending ? "Creating…" : "Add teacher"}
          </FirstLoginPrimaryButton>
          <FirstLoginGhostButton
            type="button"
            disabled={pending}
            onClick={() => router.push("/teachers")}
          >
            Cancel
          </FirstLoginGhostButton>
        </div>
      </form>
    </section>
  );
}

function SexRadio({
  value,
  checked,
  disabled,
  onChange,
}: {
  value: TeacherSex;
  checked: boolean;
  disabled: boolean;
  onChange: (sex: TeacherSex) => void;
}) {
  const id = `teacher-sex-${value}`;
  return (
    <FirstLoginRadio
      id={id}
      name="teacher-sex"
      value={value}
      checked={checked}
      disabled={disabled}
      onChange={() => {
        onChange(value);
      }}
    >
      {teacherSexLabel(value)}
    </FirstLoginRadio>
  );
}
