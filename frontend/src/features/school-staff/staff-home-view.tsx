"use client";

import { CampusSignOutButton } from "@/features/school-account/campus-sign-out-button";
import {
  FirstLoginFrame,
  FirstLoginKicker,
} from "@/features/school-account/first-login-ui";
import type { CampusSessionView } from "@/features/school-account/school-account";

export function StaffHomeView({
  session,
  schoolName,
  host,
}: {
  session: CampusSessionView;
  schoolName: string;
  host: string;
}) {
  return (
    <FirstLoginFrame>
      <FirstLoginKicker className="mb-[22px]">Signed in</FirstLoginKicker>
      <h1 className="mb-4 max-w-[14ch] text-[clamp(36px,5vw,56px)] font-light leading-[1.05] tracking-[-0.03em]">
        You’re in.
      </h1>
      <p className="mb-8 max-w-[38ch] text-[17.5px] leading-[1.65] text-site-body">
        {session.email} is signed in at {host}. A staff workspace will be here
        later.
      </p>
      <p className="mb-10 font-mono text-[12px] tracking-[0.04em] text-site-muted">
        {schoolName}
      </p>
      <CampusSignOutButton />
    </FirstLoginFrame>
  );
}
