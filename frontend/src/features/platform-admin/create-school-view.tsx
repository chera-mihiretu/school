"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateSchoolStore } from "@/stores/create-school-store";
import {
  ConsoleFieldLabel,
  ConsoleGhostButton,
  ConsoleKicker,
  ConsolePrimaryButton,
  ConsoleTextInput,
} from "./console-ui";
import { CredentialsSentDialog } from "./resend-sent-dialog";
import { tenantMailStatusCopy, validateDirectorEmail } from "./tenants";
import {
  createSchoolAction,
  resendTenantCredentialsAction,
} from "./tenants-actions";

export function CreateSchoolView({ rootHost }: { rootHost: string }) {
  const router = useRouter();
  const name = useCreateSchoolStore((state) => state.name);
  const email = useCreateSchoolStore((state) => state.email);
  const error = useCreateSchoolStore((state) => state.error);
  const pending = useCreateSchoolStore((state) => state.pending);
  const credentials = useCreateSchoolStore((state) => state.credentials);
  const emailSent = useCreateSchoolStore((state) => state.emailSent);
  const emailError = useCreateSchoolStore((state) => state.emailError);
  const schoolId = useCreateSchoolStore((state) => state.schoolId);
  const school = useCreateSchoolStore((state) => state.school);
  const resendPending = useCreateSchoolStore((state) => state.resendPending);
  const resendError = useCreateSchoolStore((state) => state.resendError);
  const resendDoneOpen = useCreateSchoolStore((state) => state.resendDoneOpen);
  const setName = useCreateSchoolStore((state) => state.setName);
  const setEmail = useCreateSchoolStore((state) => state.setEmail);
  const setError = useCreateSchoolStore((state) => state.setError);
  const setPending = useCreateSchoolStore((state) => state.setPending);
  const setResendPending = useCreateSchoolStore((state) => state.setResendPending);
  const setResendError = useCreateSchoolStore((state) => state.setResendError);
  const openResendDone = useCreateSchoolStore((state) => state.openResendDone);
  const dismissResendDone = useCreateSchoolStore((state) => state.dismissResendDone);
  const reveal = useCreateSchoolStore((state) => state.reveal);
  const reset = useCreateSchoolStore((state) => state.reset);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismissResendDone();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [dismissResendDone]);

  async function submitCreate(): Promise<void> {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length === 0) {
      setError("A school name is required.");
      return;
    }
    const invalidEmail = validateDirectorEmail(trimmedEmail);
    if (invalidEmail !== undefined) {
      setError(invalidEmail);
      return;
    }

    setPending(true);
    try {
      const result = await createSchoolAction(trimmedName, trimmedEmail);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      reveal({
        schoolId: result.school.id,
        school: result.school,
        credentials: result.credentials,
        emailSent: result.emailSent,
        ...(result.emailError !== undefined ? { emailError: result.emailError } : {}),
      });
    } finally {
      setPending(false);
    }
  }

  async function submitResend(): Promise<void> {
    if (schoolId === null) {
      setResendError("Missing school id");
      return;
    }

    setResendPending(true);
    setResendError(null);
    try {
      const result = await resendTenantCredentialsAction(schoolId);
      if (!result.ok) {
        setResendError(result.error);
        return;
      }

      openResendDone({
        school: result.school,
        credentials: result.credentials,
        emailSent: result.emailSent,
        ...(result.emailError !== undefined ? { emailError: result.emailError } : {}),
      });
    } finally {
      setResendPending(false);
    }
  }

  if (credentials !== null) {
    return (
      <div className="mx-auto w-full max-w-[1060px] flex-1 px-7 pb-[100px] pt-11">
        <button
          type="button"
          onClick={() => router.push("/platform-admin/schools")}
          className="mb-[26px] cursor-pointer border-0 bg-transparent p-0 font-spline-mono text-[11px] tracking-[0.1em] uppercase text-console-muted hover:text-console-accent"
        >
          ← Schools
        </button>

        <h1 className="mb-2.5 text-[34px] font-medium leading-[1.05] tracking-[-0.025em]">
          School created
        </h1>
        <p className="mb-8 max-w-[46ch] text-[14.5px] leading-relaxed text-console-muted">
          The director credentials were shown in the dialog. Use Resend if they
          need another email.
        </p>

        {school !== null ? (
          <div className="mb-8 max-w-[52ch] font-spline-mono text-[12.5px] leading-relaxed text-console-muted">
            Mail: {tenantMailStatusCopy(school)}
          </div>
        ) : null}

        {resendError !== null ? (
          <div className="mt-6 border-l-2 border-console-danger py-3 pl-3">
            <div className="mb-1.5 font-spline-mono text-[10px] tracking-[0.14em] uppercase text-console-danger">
              Resend failed
            </div>
            <div className="font-spline-mono text-[12.5px] leading-relaxed text-console-danger-deep">
              {resendError}
            </div>
          </div>
        ) : null}

        <div className="mt-9 flex flex-wrap gap-3">
          <ConsolePrimaryButton
            type="button"
            onClick={() => router.push("/platform-admin/schools")}
          >
            Back to schools
          </ConsolePrimaryButton>
          <ConsoleGhostButton
            type="button"
            disabled={resendPending || schoolId === null}
            onClick={() => {
              void submitResend();
            }}
          >
            {resendPending ? "Sending…" : "Resend credentials"}
          </ConsoleGhostButton>
        </div>

        <CredentialsSentDialog
          open={resendDoneOpen}
          credentials={credentials}
          emailSent={emailSent === true}
          emailError={emailError}
          onDismiss={dismissResendDone}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1060px] flex-1 px-7 pb-[100px] pt-11">
      <button
        type="button"
        onClick={() => router.push("/platform-admin/schools")}
        className="mb-[26px] cursor-pointer border-0 bg-transparent p-0 font-spline-mono text-[11px] tracking-[0.1em] uppercase text-console-muted hover:text-console-accent"
      >
        ← Schools
      </button>

      <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-2">
        <div>
          <h1 className="mb-2.5 text-[34px] font-medium leading-[1.05] tracking-[-0.025em]">
            Create a school
          </h1>
          <p className="mb-10 max-w-[42ch] text-[14.5px] leading-relaxed text-console-muted">
            Name and a director email. The director will choose a username later;
            it cannot be changed after that.
          </p>

          <ConsoleFieldLabel htmlFor="pc-name">School name</ConsoleFieldLabel>
          <ConsoleTextInput
            id="pc-name"
            value={name}
            placeholder="North Hall"
            className="mb-[30px] text-base"
            disabled={pending}
            onChange={(event) => {
              setName(event.target.value);
            }}
          />

          <ConsoleFieldLabel htmlFor="pc-email">Director email</ConsoleFieldLabel>
          <ConsoleTextInput
            id="pc-email"
            type="email"
            value={email}
            placeholder="head@north-hall.et"
            className="font-spline-mono tracking-[0.01em]"
            disabled={pending}
            onChange={(event) => {
              setEmail(event.target.value);
            }}
          />

          {error !== null ? (
            <div className="mt-5 border-l-2 border-console-danger py-3 pl-3">
              <div className="mb-1.5 font-spline-mono text-[10px] tracking-[0.14em] uppercase text-console-danger">
                Cannot create
              </div>
              <div className="font-spline-mono text-[12.5px] leading-relaxed text-console-danger-deep">
                {error}
              </div>
            </div>
          ) : null}

          <div className="mt-9 flex gap-3">
            <ConsolePrimaryButton
              type="button"
              disabled={pending}
              onClick={() => {
                void submitCreate();
              }}
            >
              {pending ? "Creating…" : "Create school"}
            </ConsolePrimaryButton>
            <ConsoleGhostButton
              type="button"
              disabled={pending}
              onClick={() => router.push("/platform-admin/schools")}
            >
              Cancel
            </ConsoleGhostButton>
          </div>
        </div>

        <div className="border-t border-console-line-strong pt-[22px]">
          <ConsoleKicker className="mb-5 tracking-[0.14em]">
            What happens next
          </ConsoleKicker>
          <p className="max-w-[38ch] text-sm leading-[1.7] text-console-muted">
            We email a temporary password and a first-login link for{" "}
            <span className="font-spline-mono text-console-ink">
              app.{rootHost}
            </span>
            . Credentials also appear in a dialog, once.
          </p>
        </div>
      </div>
    </div>
  );
}

