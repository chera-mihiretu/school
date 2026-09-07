"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCampusLoginStore } from "@/stores/campus-login-store";
import { StaffHomeView } from "@/features/school-staff/staff-home-view";
import { StaffPasswordView } from "@/features/school-staff/staff-password-view";
import { TeacherHomeView } from "@/features/school-teachers/teacher-home-view";
import { TeacherPasswordView } from "@/features/school-teachers/teacher-password-view";
import { signInCampusAccountAction } from "./actions";
import {
  FirstLoginError,
  FirstLoginFieldLabel,
  FirstLoginFrame,
  FirstLoginKicker,
  FirstLoginPrimaryButton,
  FirstLoginTextInput,
} from "./first-login-ui";
import type { CampusSessionView } from "./school-account";

export function CampusLoginView({
  schoolName,
  host,
  initialSession,
}: {
  schoolName: string;
  host: string;
  initialSession: CampusSessionView | null;
}) {
  const router = useRouter();
  const identifier = useCampusLoginStore((state) => state.identifier);
  const password = useCampusLoginStore((state) => state.password);
  const error = useCampusLoginStore((state) => state.error);
  const pending = useCampusLoginStore((state) => state.pending);
  const session = useCampusLoginStore((state) => state.session);
  const setIdentifier = useCampusLoginStore((state) => state.setIdentifier);
  const setPassword = useCampusLoginStore((state) => state.setPassword);
  const setError = useCampusLoginStore((state) => state.setError);
  const setPending = useCampusLoginStore((state) => state.setPending);
  const applySession = useCampusLoginStore((state) => state.applySession);
  const reset = useCampusLoginStore((state) => state.reset);

  useEffect(() => {
    if (initialSession !== null) {
      applySession(initialSession);
    }
  }, [applySession, initialSession]);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const current = session ?? initialSession;

  async function submitSignIn(): Promise<void> {
    if (identifier.trim().length === 0 || password.length === 0) {
      setError("Email or school ID and password are required.");
      return;
    }

    setPending(true);
    try {
      const result = await signInCampusAccountAction(identifier, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      switch (result.session.kind) {
        case "director":
          router.replace("/dashboard");
          router.refresh();
          return;
        case "teacher":
        case "staff":
          applySession(result.session);
          return;
        default: {
          const _never: never = result.session.kind;
          return _never;
        }
      }
    } finally {
      setPending(false);
    }
  }

  if (current !== null) {
    return (
      <SignedInCampus
        session={current}
        schoolName={schoolName}
        host={host}
      />
    );
  }

  return (
    <FirstLoginFrame>
      <FirstLoginKicker className="mb-[22px]">Campus sign-in</FirstLoginKicker>
      <h1 className="mb-4 max-w-[14ch] text-[clamp(36px,5vw,56px)] font-light leading-[1.05] tracking-[-0.03em]">
        Log in again here.
      </h1>
      <p className="mb-12 max-w-[38ch] text-[17.5px] leading-[1.65] text-site-body">
        Directors use their email and the password they chose on first login.
        Teachers and staff use their email or school ID and the temporary
        password from the letter. The app host will not accept these
        credentials.
      </p>
      <form
        className="flex flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          void submitSignIn();
        }}
      >
        <FirstLoginFieldLabel htmlFor="campus-identifier">
          Email or school ID
        </FirstLoginFieldLabel>
        <FirstLoginTextInput
          id="campus-identifier"
          type="text"
          name="identifier"
          autoComplete="username"
          required
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          disabled={pending}
          placeholder="you@school.et or AAAT/00001/26"
          className="mb-8"
        />
        <FirstLoginFieldLabel htmlFor="campus-password">
          Password
        </FirstLoginFieldLabel>
        <FirstLoginTextInput
          id="campus-password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={pending}
          placeholder="Your campus password"
        />
        <FirstLoginError error={error} />
        <FirstLoginPrimaryButton
          type="submit"
          disabled={pending}
          className={pending ? "mt-10 w-full disabled:cursor-wait" : "mt-10 w-full"}
        >
          {pending ? "Signing in…" : "Log in"}
        </FirstLoginPrimaryButton>
      </form>
    </FirstLoginFrame>
  );
}

function SignedInCampus({
  session,
  schoolName,
  host,
}: {
  session: CampusSessionView;
  schoolName: string;
  host: string;
}) {
  const router = useRouter();

  useEffect(() => {
    if (session.kind === "director") {
      router.replace("/dashboard");
    }
  }, [router, session.kind]);

  switch (session.kind) {
    case "director":
      return null;
    case "teacher":
      if (session.mustChangePassword) {
        return <TeacherPasswordView session={session} />;
      }
      return (
        <TeacherHomeView
          session={session}
          schoolName={schoolName}
          host={host}
        />
      );
    case "staff":
      if (session.mustChangePassword) {
        return <StaffPasswordView session={session} />;
      }
      return (
        <StaffHomeView
          session={session}
          schoolName={schoolName}
          host={host}
        />
      );
    default: {
      const _never: never = session.kind;
      return _never;
    }
  }
}
