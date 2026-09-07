"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useContactInboxStore } from "@/stores/contact-inbox-store";
import { actOnContactMessageAction } from "./contact-messages-actions";
import type { ContactMessage } from "./contact-messages-api";
import {
  ConsoleGhostButton,
  ConsoleKicker,
  ConsolePrimaryButton,
} from "./console-ui";

type ContactMessagesViewProps = {
  messages: ContactMessage[];
  total: number;
  pending: number;
  initialError: string | null;
};

function formatReceivedAt(iso: string): string {
  if (iso.length === 0) {
    return "—";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Addis_Ababa",
  }).format(date);
}

function replyHref(message: ContactMessage): string {
  const subject = encodeURIComponent(`Re: ${message.school} — e-school.et`);
  return `mailto:${message.email}?subject=${subject}`;
}

export function ContactMessagesView({
  messages,
  total,
  pending,
  initialError,
}: ContactMessagesViewProps) {
  const router = useRouter();
  const selectedId = useContactInboxStore((state) => state.selectedId);
  const error = useContactInboxStore((state) => state.error);
  const acting = useContactInboxStore((state) => state.pending);
  const select = useContactInboxStore((state) => state.select);
  const close = useContactInboxStore((state) => state.close);
  const setError = useContactInboxStore((state) => state.setError);
  const setPending = useContactInboxStore((state) => state.setPending);

  const selected = useMemo(
    () => messages.find((message) => message.id === selectedId) ?? null,
    [messages, selectedId],
  );

  async function markActed() {
    if (selected === null) {
      return;
    }
    setPending(true);
    const result = await actOnContactMessageAction(selected.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    close();
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-[1060px] flex-1 px-7 pb-[100px] pt-11">
      <Link
        href="/platform-admin"
        className="mb-[26px] inline-block font-spline-mono text-[11px] tracking-[0.1em] uppercase text-console-muted hover:text-console-accent"
      >
        ← Console home
      </Link>

      <div className="mb-[30px]">
        <h1 className="m-0 text-[34px] font-medium leading-none tracking-[-0.025em]">
          Messages
        </h1>
        <p className="mt-3 max-w-[52ch] text-[14.5px] leading-relaxed text-console-muted">
          Open a row with Act on. A note sitting in a list will be ignored.
        </p>
      </div>

      {initialError !== null ? (
        <div className="mb-[22px] flex items-center gap-3 border-l-2 border-console-danger bg-console-surface px-3.5 py-3">
          <span className="font-spline-mono text-[12.5px] text-console-danger-deep">
            {initialError}
          </span>
        </div>
      ) : null}

      <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_132px_140px] items-center gap-4 border-b border-console-line-strong py-3 font-spline-mono text-[10px] tracking-[0.14em] uppercase text-console-muted lg:grid">
        <div>School</div>
        <div>From</div>
        <div>Received</div>
        <div className="text-right">Action</div>
      </div>

      {messages.map((message) => (
        <article
          key={message.id}
          className="grid grid-cols-1 items-center gap-3 border-b border-console-line py-[19px] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_132px_140px] lg:gap-4"
        >
          <div>
            <div className="text-[16.5px] tracking-[-0.01em]">{message.school}</div>
            <div className="mt-1 font-spline-mono text-[12px] text-console-muted">
              {message.email}
            </div>
          </div>
          <div>
            <div className="text-[15px]">{message.name}</div>
            {message.role !== null ? (
              <div className="mt-1 font-spline-mono text-[12px] text-console-muted">
                {message.role}
              </div>
            ) : null}
          </div>
          <div className="font-spline-mono text-[12px] text-console-faint">
            {formatReceivedAt(message.created)}
          </div>
          <div className="lg:text-right">
            {message.acted ? (
              <span className="font-spline-mono text-[11px] tracking-[0.12em] uppercase text-console-faint">
                Acted
              </span>
            ) : (
              <ConsolePrimaryButton
                type="button"
                className="px-4 py-2.5"
                onClick={() => {
                  select(message.id);
                }}
              >
                Act on
              </ConsolePrimaryButton>
            )}
          </div>
        </article>
      ))}

      {messages.length === 0 ? (
        <div className="border-b border-console-line px-0 py-16 text-center">
          <div className="font-spline-mono text-[12.5px] tracking-[0.04em] text-console-muted">
            No messages yet.
          </div>
        </div>
      ) : null}

      <div className="mt-[18px] font-spline-mono text-[11px] text-console-faint">
        {pending} to act on · {total} {total === 1 ? "message" : "messages"}
      </div>

      <ConsoleKicker className="mt-10 tracking-[0.14em]">
        Landing form only
      </ConsoleKicker>

      {selected !== null ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-console-overlay p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="act-on-title"
            className="w-full max-w-[560px] border-t-[3px] border-console-accent bg-console-surface px-8 py-[30px]"
          >
            <ConsoleKicker className="mb-4 tracking-[0.16em]">
              Act on this note
            </ConsoleKicker>
            <h2
              id="act-on-title"
              className="mb-1.5 text-[25px] font-medium leading-[1.15] tracking-[-0.02em]"
            >
              {selected.school}
            </h2>
            <div className="mb-5 font-spline-mono text-[12.5px] text-console-muted">
              {selected.name}
              {selected.role !== null ? ` · ${selected.role}` : ""} ·{" "}
              {selected.email}
              <div className="mt-1 text-console-faint">
                {formatReceivedAt(selected.created)}
              </div>
            </div>
            <p className="mb-6 border-t border-console-line pt-5 text-[15px] leading-relaxed text-console-ink">
              {selected.note.length > 0
                ? selected.note
                : "No note was written. Reply to the sender anyway."}
            </p>
            {error !== null ? (
              <div className="mb-4 font-spline-mono text-[12.5px] text-console-danger-deep">
                {error}
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <ConsolePrimaryButton
                type="button"
                disabled={acting}
                onClick={() => {
                  void markActed();
                }}
              >
                {acting ? "Marking…" : "Mark acted"}
              </ConsolePrimaryButton>
              <a
                href={replyHref(selected)}
                className="cursor-pointer border border-console-line bg-transparent px-[22px] py-3.5 font-spline-mono text-[11.5px] tracking-[0.14em] uppercase text-console-muted hover:border-console-muted"
              >
                Reply
              </a>
              <ConsoleGhostButton type="button" onClick={close}>
                Close
              </ConsoleGhostButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
