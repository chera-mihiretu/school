"use client";

import {
  FirstLoginGhostButton,
  FirstLoginKicker,
} from "@/features/school-account/first-login-ui";
import type { TeacherCredentials } from "./school-teachers";

export function TeacherCredentialsDialog({
  open,
  credentials,
  emailSent,
  emailError,
  onDismiss,
}: {
  open: boolean;
  credentials: TeacherCredentials | null;
  emailSent: boolean;
  emailError: string | null;
  onDismiss: () => void;
}) {
  if (!open || credentials === null) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-site-ink/45 p-6"
      onClick={onDismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-credentials-sent-title"
        className="w-full max-w-[520px] border-t-[3px] border-site-brick bg-site-canvas px-8 py-[34px]"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="mb-5 flex justify-center text-site-brick">
          {emailSent ? <MailSentIcon /> : <MailFailedIcon />}
        </div>
        <h2
          id="teacher-credentials-sent-title"
          className="mb-2 text-center text-[25px] font-light leading-[1.15] tracking-[-0.02em]"
        >
          {emailSent ? "Email sent" : "Email was not sent"}
        </h2>
        <p className="mb-6 text-center text-[15px] leading-relaxed text-site-body">
          {emailSent
            ? "Shown once. Copy these details if you need them."
            : (emailError ?? "The credentials email could not be delivered.") +
              " Copy these details and send them yourself."}
        </p>
        <div className="border-t border-site-line">
          {credentials.schoolId !== null ? (
            <CredentialRow label="School ID" value={credentials.schoolId} />
          ) : null}
          <CredentialRow label="Email" value={credentials.email} />
          <CredentialRow label="Temporary password" value={credentials.password} />
          <CredentialRow label="Campus login" value={credentials.loginUrl} />
        </div>
        <div className="mt-8 flex justify-center">
          <FirstLoginGhostButton type="button" onClick={onDismiss}>
            Close
          </FirstLoginGhostButton>
        </div>
      </div>
    </div>
  );
}

function CredentialRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-site-line py-3 text-left">
      <FirstLoginKicker className="mb-1">{label}</FirstLoginKicker>
      <div className="break-all font-mono text-[14px] leading-relaxed text-site-ink">
        {value}
      </div>
    </div>
  );
}

function MailSentIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="6"
        y="12"
        width="44"
        height="32"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 16 L28 30 L48 16"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <circle
        cx="42"
        cy="40"
        r="10"
        className="fill-site-canvas"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M37.5 40.5 L40.5 43.5 L46.5 36.5"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

function MailFailedIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="6"
        y="12"
        width="44"
        height="32"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 16 L28 30 L48 16"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}
