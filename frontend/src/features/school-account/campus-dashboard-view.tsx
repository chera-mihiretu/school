import Link from "next/link";
import {
  FirstLoginError,
  FirstLoginKicker,
  FirstLoginPrimaryLink,
} from "./first-login-ui";

export function CampusDashboardView({
  schoolName,
  teacherCount,
  listError,
}: {
  schoolName: string;
  teacherCount: number | null;
  listError: string | null;
}) {
  return (
    <section className="w-full">
      <FirstLoginKicker className="mb-[22px]">Dashboard</FirstLoginKicker>
      <h1 className="mb-4 max-w-[16ch] text-[clamp(36px,5vw,56px)] font-light leading-[1.05] tracking-[-0.03em]">
        {schoolName}
      </h1>
      <p className="mb-12 max-w-[42ch] text-[17.5px] leading-[1.65] text-site-body">
        Welcome back. This is the director workspace for {schoolName}.
      </p>

      {listError !== null ? <FirstLoginError error={listError} /> : null}

      {teacherCount !== null ? (
        <Link
          href="/teachers"
          className="mb-12 block border-t border-site-line pt-8 no-underline"
        >
          <FirstLoginKicker className="mb-3">On this campus</FirstLoginKicker>
          <p className="font-newsreader text-[32px] font-light leading-none tracking-[-0.03em] text-site-ink">
            {teacherCount}
          </p>
          <p className="mt-2 text-[16px] leading-relaxed text-site-body">
            {teacherCount === 1 ? "teacher" : "teachers"}
          </p>
        </Link>
      ) : null}

      <FirstLoginPrimaryLink href="/teachers/new">
        Add a teacher
      </FirstLoginPrimaryLink>
    </section>
  );
}
