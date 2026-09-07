"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirstLoginStore } from "@/stores/first-login-store";
import {
  changeSchoolAccountPasswordAction,
  signInSchoolAccountAction,
} from "./actions";
import {
  FirstLoginError,
  FirstLoginFieldLabel,
  FirstLoginFrame,
  FirstLoginKicker,
  FirstLoginPrimaryButton,
  FirstLoginTextInput,
} from "./first-login-ui";
import type { SchoolSessionView } from "./school-account";

export function FirstLoginView({
  initialEmail,
  initialSession,
}: {
  initialEmail: string;
  initialSession: SchoolSessionView | null;
}) {
  const email = useFirstLoginStore((state) => state.email);
  const password = useFirstLoginStore((state) => state.password);
  const currentPassword = useFirstLoginStore((state) => state.currentPassword);
  const newPassword = useFirstLoginStore((state) => state.newPassword);
  const confirmPassword = useFirstLoginStore((state) => state.confirmPassword);
  const error = useFirstLoginStore((state) => state.error);
  const pending = useFirstLoginStore((state) => state.pending);
  const nextStep = useFirstLoginStore((state) => state.nextStep);
  const session = useFirstLoginStore((state) => state.session);
  const setEmail = useFirstLoginStore((state) => state.setEmail);
  const setPassword = useFirstLoginStore((state) => state.setPassword);
  const setCurrentPassword = useFirstLoginStore((state) => state.setCurrentPassword);
  const setNewPassword = useFirstLoginStore((state) => state.setNewPassword);
  const setConfirmPassword = useFirstLoginStore((state) => state.setConfirmPassword);
  const setError = useFirstLoginStore((state) => state.setError);
  const setPending = useFirstLoginStore((state) => state.setPending);
  const applySession = useFirstLoginStore((state) => state.applySession);
  const hydrateEmail = useFirstLoginStore((state) => state.hydrateEmail);
  const router = useRouter();

  useEffect(() => {
    if (initialSession !== null) {
      applySession(initialSession);
      return;
    }
    if (initialEmail.length > 0) {
      hydrateEmail(initialEmail);
    }
  }, [applySession, hydrateEmail, initialEmail, initialSession]);

  const step = session?.nextStep ?? nextStep;

  useEffect(() => {
    if (step === "username") {
      router.replace("/first-login/username");
    }
    if (step === "abbreviation") {
      router.replace("/first-login/abbreviation");
    }
  }, [router, step]);

  async function submitSignIn(): Promise<void> {
    if (email.trim().length === 0 || password.length === 0) {
      setError("Email and password are required.");
      return;
    }

    setPending(true);
    try {
      const result = await signInSchoolAccountAction(email, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      applySession(result.session);
    } finally {
      setPending(false);
    }
  }

  async function submitPassword(): Promise<void> {
    if (newPassword.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from the current password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const result = await changeSchoolAccountPasswordAction(
        currentPassword,
        newPassword,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      applySession(result.session);
      if (result.session.nextStep === "username") {
        router.replace("/first-login/username");
      }
      if (result.session.nextStep === "abbreviation") {
        router.replace("/first-login/abbreviation");
      }
    } finally {
      setPending(false);
    }
  }

  switch (step) {
    case "password":
      return (
        <ChangePasswordScreen
          email={email}
          currentPassword={currentPassword}
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          error={error}
          pending={pending}
          onCurrentPassword={setCurrentPassword}
          onNewPassword={setNewPassword}
          onConfirmPassword={setConfirmPassword}
          onSubmit={submitPassword}
        />
      );
    case "username":
      return null;
    case "abbreviation":
      return null;
    case null:
      return (
        <SignInScreen
          email={email}
          password={password}
          error={error}
          pending={pending}
          onEmail={setEmail}
          onPassword={setPassword}
          onSubmit={submitSignIn}
        />
      );
    default: {
      const _never: never = step;
      return _never;
    }
  }
}

function SignInScreen({
  email,
  password,
  error,
  pending,
  onEmail,
  onPassword,
  onSubmit,
}: {
  email: string;
  password: string;
  error: string | null;
  pending: boolean;
  onEmail: (value: string) => void;
  onPassword: (value: string) => void;
  onSubmit: () => Promise<void>;
}) {
  return (
    <FirstLoginFrame>
      <FirstLoginKicker className="mb-[22px]">First sign-in</FirstLoginKicker>
      <h1 className="mb-4 max-w-[14ch] text-[clamp(36px,5vw,56px)] font-light leading-[1.05] tracking-[-0.03em]">
        Welcome to the network.
      </h1>
      <p className="mb-12 max-w-[38ch] text-[17.5px] leading-[1.65] text-site-body">
        Use the email and temporary password from the letter we sent. You will
        choose a lasting password next.
      </p>
      <form
        className="flex flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
      >
        <FirstLoginFieldLabel htmlFor="school-email">Email</FirstLoginFieldLabel>
        <FirstLoginTextInput
          id="school-email"
          type="email"
          name="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => onEmail(event.target.value)}
          disabled={pending}
          placeholder="director@school.et"
          className="mb-8"
        />
        <FirstLoginFieldLabel htmlFor="school-password">
          Temporary password
        </FirstLoginFieldLabel>
        <FirstLoginTextInput
          id="school-password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => onPassword(event.target.value)}
          disabled={pending}
          placeholder="From the letter"
        />
        <FirstLoginError error={error} />
        <FirstLoginPrimaryButton
          type="submit"
          disabled={pending}
          className={pending ? "mt-10 w-full disabled:cursor-wait" : "mt-10 w-full"}
        >
          {pending ? "Signing in…" : "Continue"}
        </FirstLoginPrimaryButton>
      </form>
    </FirstLoginFrame>
  );
}

function ChangePasswordScreen({
  email,
  currentPassword,
  newPassword,
  confirmPassword,
  error,
  pending,
  onCurrentPassword,
  onNewPassword,
  onConfirmPassword,
  onSubmit,
}: {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  error: string | null;
  pending: boolean;
  onCurrentPassword: (value: string) => void;
  onNewPassword: (value: string) => void;
  onConfirmPassword: (value: string) => void;
  onSubmit: () => Promise<void>;
}) {
  return (
    <FirstLoginFrame wide>
      <FirstLoginKicker className="mb-[22px]">Step 1 of 3</FirstLoginKicker>
      <h1 className="mb-4 max-w-[16ch] text-[clamp(40px,6vw,68px)] font-light leading-[1.02] tracking-[-0.035em]">
        Choose a password you will keep.
      </h1>
      <p className="mb-14 max-w-[42ch] text-[18.5px] leading-[1.65] text-site-body">
        At least twelve characters. It cannot be the temporary password sent to{" "}
        <span className="text-site-ink">{email}</span>.
      </p>
      <form
        className="flex max-w-[440px] flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
      >
        <FirstLoginFieldLabel htmlFor="school-current-password">
          Current password
        </FirstLoginFieldLabel>
        <FirstLoginTextInput
          id="school-current-password"
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(event) => onCurrentPassword(event.target.value)}
          disabled={pending}
          placeholder="Temporary password"
          className="mb-8"
        />
        <FirstLoginFieldLabel htmlFor="school-new-password">
          New password
        </FirstLoginFieldLabel>
        <FirstLoginTextInput
          id="school-new-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={newPassword}
          onChange={(event) => onNewPassword(event.target.value)}
          disabled={pending}
          placeholder="At least 12 characters"
          className="mb-8"
        />
        <FirstLoginFieldLabel htmlFor="school-confirm-password">
          Confirm new password
        </FirstLoginFieldLabel>
        <FirstLoginTextInput
          id="school-confirm-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={confirmPassword}
          onChange={(event) => onConfirmPassword(event.target.value)}
          disabled={pending}
          placeholder="Type it again"
        />
        <FirstLoginError error={error} />
        <FirstLoginPrimaryButton
          type="submit"
          disabled={pending}
          className={pending ? "mt-12 w-full disabled:cursor-wait" : "mt-12 w-full"}
        >
          {pending ? "Saving…" : "Save password"}
        </FirstLoginPrimaryButton>
      </form>
    </FirstLoginFrame>
  );
}

