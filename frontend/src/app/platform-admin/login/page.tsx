import { redirect } from "next/navigation";
import { PlatformAdminLoginForm } from "@/features/platform-admin/login-form";
import { getPlatformAdminIdentity } from "@/features/platform-admin/session";
import { ConsoleKicker } from "@/features/platform-admin/console-ui";

export default async function PlatformAdminLoginPage() {
  const session = await getPlatformAdminIdentity();
  if (session !== undefined) {
    redirect("/platform-admin");
  }

  return (
    <main className="flex flex-1 justify-center px-7 pb-10 pt-[10vh]">
      <section className="w-full max-w-[392px] animate-ome-rise">
        <ConsoleKicker className="mb-[22px] text-console-accent">Restricted</ConsoleKicker>
        <h1 className="mb-2.5 text-[34px] font-medium leading-tight tracking-[-0.02em]">
          Sign in to the console
        </h1>
        <p className="mb-10 max-w-[34ch] text-[14.5px] leading-relaxed text-console-muted">
          Platform operators only. School staff and families sign in on their own
          campus address.
        </p>
        <PlatformAdminLoginForm />
      </section>
    </main>
  );
}
