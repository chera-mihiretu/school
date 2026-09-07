"use client";

import { useCampusLoginStore } from "@/stores/campus-login-store";
import { CampusSignOutButton } from "@/features/school-account/campus-sign-out-button";
import {
  FirstLoginError,
  FirstLoginFieldLabel,
  FirstLoginFrame,
  FirstLoginKicker,
  FirstLoginPrimaryButton,
  FirstLoginTextInput,
} from "@/features/school-account/first-login-ui";
import type { CampusSessionView } from "@/features/school-account/school-account";
import { changeStaffPasswordAction } from "./actions";

export function StaffPasswordView({
  session,
}: {
  session: CampusSessionView;
}) {
  const newPassword = useCampusLoginStore((state) => state.newPassword);
  const confirmPassword = useCampusLoginStore((state) => state.confirmPassword);
  const error = useCampusLoginStore((state) => state.error);
  const pending = useCampusLoginStore((state) => state.pending);
  const setNewPassword = useCampusLoginStore((state) => state.setNewPassword);
  const setConfirmPassword = useCampusLoginStore(
    (state) => state.setConfirmPassword,
  );
  const setError = useCampusLoginStore((state) => state.setError);
  const setPending = useCampusLoginStore((state) => state.setPending);
  const applySession = useCampusLoginStore((state) => state.applySession);

  async function submitPassword(): Promise<void> {
    if (newPassword.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const result = await changeStaffPasswordAction(newPassword);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      applySession(result.session);
    } finally {
      setPending(false);
    }
  }

  return (
    <FirstLoginFrame wide>
      <FirstLoginKicker className="mb-[22px]">First sign-in</FirstLoginKicker>
      <h1 className="mb-4 max-w-[16ch] text-[clamp(40px,6vw,68px)] font-light leading-[1.02] tracking-[-0.035em]">
        Choose a password you will keep.
      </h1>
      <p className="mb-14 max-w-[42ch] text-[18.5px] leading-[1.65] text-site-body">
        At least twelve characters. It cannot be the temporary password sent to{" "}
        <span className="text-site-ink">{session.email}</span>.
      </p>
      <form
        className="flex max-w-[440px] flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          void submitPassword();
        }}
      >
        <FirstLoginFieldLabel htmlFor="staff-new-password">
          New password
        </FirstLoginFieldLabel>
        <FirstLoginTextInput
          id="staff-new-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          disabled={pending}
          placeholder="At least 12 characters"
          className="mb-8"
        />
        <FirstLoginFieldLabel htmlFor="staff-confirm-password">
          Confirm new password
        </FirstLoginFieldLabel>
        <FirstLoginTextInput
          id="staff-confirm-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
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
      <div className="mt-10">
        <CampusSignOutButton />
      </div>
    </FirstLoginFrame>
  );
}
