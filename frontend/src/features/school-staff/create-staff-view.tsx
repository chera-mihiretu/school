"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStaffStore } from "@/stores/staff-store";
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
  createSchoolStaffAction,
  resendSchoolStaffCredentialsAction,
} from "./actions";
import { StaffCredentialsDialog } from "./credentials-sent-dialog";
import {
  staffMailStatusCopy,
  staffSexLabel,
  validateStaffDraft,
  type StaffSex,
} from "./school-staff";

export function CreateStaffView({ schoolName }: { schoolName: string }) {
  const router = useRouter();
  const staff = useStaffStore((state) => state.staff);
  const error = useStaffStore((state) => state.error);
  const givenName = useStaffStore((state) => state.givenName);
  const fatherName = useStaffStore((state) => state.fatherName);
  const grandfatherName = useStaffStore((state) => state.grandfatherName);
  const sex = useStaffStore((state) => state.sex);
  const phone = useStaffStore((state) => state.phone);
  const email = useStaffStore((state) => state.email);
  const pending = useStaffStore((state) => state.pending);
  const resendPendingId = useStaffStore((state) => state.resendPendingId);
  const resendError = useStaffStore((state) => state.resendError);
  const credentials = useStaffStore((state) => state.credentials);
  const emailSent = useStaffStore((state) => state.emailSent);
  const emailError = useStaffStore((state) => state.emailError);
  const revealOpen = useStaffStore((state) => state.revealOpen);
  const setGivenName = useStaffStore((state) => state.setGivenName);
  const setFatherName = useStaffStore((state) => state.setFatherName);
  const setGrandfatherName = useStaffStore((state) => state.setGrandfatherName);
  const setSex = useStaffStore((state) => state.setSex);
  const setPhone = useStaffStore((state) => state.setPhone);
  const setEmail = useStaffStore((state) => state.setEmail);
  const setError = useStaffStore((state) => state.setError);
  const setPending = useStaffStore((state) => state.setPending);
  const setResendPendingId = useStaffStore((state) => state.setResendPendingId);
  const setResendError = useStaffStore((state) => state.setResendError);
  const reveal = useStaffStore((state) => state.reveal);
  const openResendDone = useStaffStore((state) => state.openResendDone);
  const dismissReveal = useStaffStore((state) => state.dismissReveal);
  const resetDraft = useStaffStore((state) => state.resetDraft);

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
      : staff.find((member) => member.email === credentials.email);

  async function submitCreate(): Promise<void> {
    const invalid = validateStaffDraft({
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
      const result = await createSchoolStaffAction({
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
        staff: result.staff,
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

  if (credentials !== null) {
    return (
      <section className="w-full">
        <Link
          href="/staff"
          className="mb-[26px] inline-block font-mono text-[11px] tracking-[0.1em] uppercase text-site-muted no-underline hover:text-site-brick"
        >
          ← Staff
        </Link>
        <h1 className="mb-4 max-w-[16ch] text-[clamp(36px,5vw,56px)] font-light leading-[1.05] tracking-[-0.03em]">
          Staff created
        </h1>
        <p className="mb-8 max-w-[46ch] text-[17.5px] leading-[1.65] text-site-body">
          The credentials were shown in the dialog. Use Resend if they need
          another email.
        </p>
        {created !== undefined ? (
          <p className="mb-8 font-mono text-[12.5px] leading-relaxed text-site-muted">
            Mail: {staffMailStatusCopy(created)}
          </p>
        ) : null}
        {resendError !== null ? <FirstLoginError error={resendError} /> : null}
        <div className="mt-9 flex flex-wrap gap-3">
          <FirstLoginPrimaryButton
            type="button"
            onClick={() => router.push("/staff")}
          >
            Back to staff
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

  return (
    <section className="w-full">
      <Link
        href="/staff"
        className="mb-[26px] inline-block font-mono text-[11px] tracking-[0.1em] uppercase text-site-muted no-underline hover:text-site-brick"
      >
        ← Staff
      </Link>
      <FirstLoginKicker className="mb-[22px]">Add</FirstLoginKicker>
      <h1 className="mb-4 max-w-[16ch] text-[clamp(36px,5vw,56px)] font-light leading-[1.05] tracking-[-0.03em]">
        Add a staff member
      </h1>
      <p className="mb-12 max-w-[42ch] text-[17.5px] leading-[1.65] text-site-body">
        Create a staff account for {schoolName}. They sign in on this campus,
        not on the app host.
      </p>

      <form
        className="flex w-full max-w-[36rem] flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          void submitCreate();
        }}
      >
        <FirstLoginFieldLabel htmlFor="staff-given-name">
          Given name
        </FirstLoginFieldLabel>
        <FirstLoginTextInput
          id="staff-given-name"
          name="givenName"
          autoComplete="given-name"
          required
          value={givenName}
          onChange={(event) => setGivenName(event.target.value)}
          disabled={pending}
          placeholder="Abebe"
          className="mb-8"
        />

        <FirstLoginFieldLabel htmlFor="staff-father-name">
          Father’s name
        </FirstLoginFieldLabel>
        <FirstLoginTextInput
          id="staff-father-name"
          name="fatherName"
          required
          value={fatherName}
          onChange={(event) => setFatherName(event.target.value)}
          disabled={pending}
          placeholder="Kebede"
          className="mb-8"
        />

        <FirstLoginFieldLabel htmlFor="staff-grandfather-name">
          Grandfather’s name
        </FirstLoginFieldLabel>
        <FirstLoginTextInput
          id="staff-grandfather-name"
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

        <FirstLoginFieldLabel htmlFor="staff-phone">
          Mobile
        </FirstLoginFieldLabel>
        <div className="mb-2 flex items-center gap-3">
          <span className="font-mono text-[13px] tracking-[0.04em] text-site-muted">
            +251
          </span>
          <FirstLoginTextInput
            id="staff-phone"
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

        <FirstLoginFieldLabel htmlFor="staff-email">Email</FirstLoginFieldLabel>
        <FirstLoginTextInput
          id="staff-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={pending}
          placeholder="staff@school.et"
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
            {pending ? "Creating…" : "Add staff member"}
          </FirstLoginPrimaryButton>
          <FirstLoginGhostButton
            type="button"
            disabled={pending}
            onClick={() => router.push("/staff")}
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
  value: StaffSex;
  checked: boolean;
  disabled: boolean;
  onChange: (sex: StaffSex) => void;
}) {
  const id = `staff-sex-${value}`;
  return (
    <FirstLoginRadio
      id={id}
      name="staff-sex"
      value={value}
      checked={checked}
      disabled={disabled}
      onChange={() => {
        onChange(value);
      }}
    >
      {staffSexLabel(value)}
    </FirstLoginRadio>
  );
}
