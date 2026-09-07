"use client";

import { useActionState } from "react";
import { signInPlatformAdmin, type SignInState } from "./actions";
import {
  ConsoleFieldLabel,
  ConsolePrimaryButton,
  ConsoleTextInput,
} from "./console-ui";

const initialState: SignInState = { error: null };

export function PlatformAdminLoginForm() {
  const [state, formAction, pending] = useActionState(
    signInPlatformAdmin,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col">
      <ConsoleFieldLabel htmlFor="pc-email">Operator email</ConsoleFieldLabel>
      <ConsoleTextInput
        id="pc-email"
        type="email"
        name="email"
        autoComplete="username"
        required
        placeholder="operator@e-school.et"
        className="mb-[26px]"
      />

      <ConsoleFieldLabel htmlFor="pc-pass">Password</ConsoleFieldLabel>
      <ConsoleTextInput
        id="pc-pass"
        type="password"
        name="password"
        autoComplete="current-password"
        required
        placeholder="Console password"
      />

      {state.error !== null ? (
        <div className="mt-3.5 border-l-2 border-console-danger pl-2.5">
          <span className="font-spline-mono text-[12.5px] leading-normal text-console-danger-deep">
            {state.error}
          </span>
        </div>
      ) : null}

      <ConsolePrimaryButton
        type="submit"
        disabled={pending}
        className="mt-[34px] w-full py-[15px]"
      >
        {pending ? "Signing in…" : "Sign in"}
      </ConsolePrimaryButton>
    </form>
  );
}
