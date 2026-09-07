"use client";

import type {
  FormEvent,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { submitContactMessage } from "@/features/school-site/contact-actions";
import { useContactStore } from "@/stores/contact-store";
import { cn } from "@/features/ui/cn";

const apexFieldClassName =
  "w-full rounded-none border border-site-apex-line bg-site-apex px-3.5 py-3 font-newsreader text-[16px] text-site-apex-ink outline-none placeholder:text-site-apex-muted/70 focus:border-site-apex-button focus:ring-1 focus:ring-site-apex-button disabled:cursor-not-allowed disabled:opacity-60";

function ApexFieldLabel({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={cn(
        "mb-2 block font-mono text-[12px] tracking-[0.1em] uppercase text-site-apex-ink",
        className,
      )}
    />
  );
}

function ApexTextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(apexFieldClassName, className)} />;
}

function ApexTextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(apexFieldClassName, "min-h-[88px] resize-y", className)}
    />
  );
}

type ContactFormProps = {
  rootHost: string;
};

export function ContactForm({ rootHost }: ContactFormProps) {
  const sentTo = useContactStore((state) => state.sentTo);
  const error = useContactStore((state) => state.error);
  const pending = useContactStore((state) => state.pending);
  const setSentTo = useContactStore((state) => state.setSentTo);
  const setError = useContactStore((state) => state.setError);
  const setPending = useContactStore((state) => state.setPending);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const school = String(data.get("school") ?? "");
    const name = String(data.get("name") ?? "");
    const role = String(data.get("role") ?? "");
    const email = String(data.get("email") ?? "").trim();
    const note = String(data.get("note") ?? "");

    setPending(true);
    const result = await submitContactMessage({
      school,
      name,
      role,
      email,
      note,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSentTo(email);
  }

  if (sentTo !== null) {
    return (
      <div className="border border-site-apex-line px-6 py-7">
        <p className="m-0 max-w-[42ch] text-[17px] leading-[1.55] text-site-apex-ink">
          We’ll reply by email at {sentTo}. This is not an account. If we take
          the school on, we send a registration link from that thread.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col">
      <p className="mb-7 max-w-[46ch] text-[16px] leading-[1.55] text-site-apex-muted">
        Hosting on {rootHost}. Work email only — we will not open a campus from
        this form.
      </p>

      <ApexFieldLabel htmlFor="contact-school">School name</ApexFieldLabel>
      <ApexTextInput
        id="contact-school"
        name="school"
        type="text"
        required
        autoComplete="organization"
        disabled={pending}
        placeholder="North Hall"
        className="mb-5"
      />

      <ApexFieldLabel htmlFor="contact-name">Your name</ApexFieldLabel>
      <ApexTextInput
        id="contact-name"
        name="name"
        type="text"
        required
        autoComplete="name"
        disabled={pending}
        placeholder="Full name"
        className="mb-5"
      />

      <ApexFieldLabel htmlFor="contact-role">Role</ApexFieldLabel>
      <ApexTextInput
        id="contact-role"
        name="role"
        type="text"
        disabled={pending}
        placeholder="Director, trustee, founder…"
        className="mb-5"
      />

      <ApexFieldLabel htmlFor="contact-email">Work email</ApexFieldLabel>
      <ApexTextInput
        id="contact-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        disabled={pending}
        placeholder="you@school.et"
        className="mb-5"
      />

      <ApexFieldLabel htmlFor="contact-note">Note</ApexFieldLabel>
      <ApexTextArea
        id="contact-note"
        name="note"
        rows={3}
        disabled={pending}
        placeholder="Anything we should know"
        className="mb-8"
      />

      {error !== null ? (
        <p className="mb-5 max-w-[46ch] border-l-2 border-red-400/80 pl-3 text-[15px] leading-[1.5] text-red-200">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start bg-site-apex-button px-[26px] py-[15px] font-bricolage text-[13.5px] text-site-apex hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send a message"}
      </button>
    </form>
  );
}
