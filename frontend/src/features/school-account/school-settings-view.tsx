"use client";

import { useEffect, useRef, useState } from "react";
import {
  claimSettingsAbbreviationAction,
  readSettingsAbbreviationAction,
} from "@/features/school-account/actions";
import { ABBREVIATION_LOOKUP_DEBOUNCE_MS } from "@/features/school-account/constants";
import {
  FirstLoginCheckbox,
  FirstLoginError,
  FirstLoginFieldLabel,
  FirstLoginKicker,
  FirstLoginPrimaryButton,
  FirstLoginTextInput,
} from "@/features/school-account/first-login-ui";
import {
  normalizeAbbreviationDraft,
  type AbbreviationLookup,
  type AbbreviationPreview,
} from "@/features/school-account/school-abbreviation";

export function SchoolSettingsView({
  initialPreview,
  initialError,
}: {
  initialPreview: AbbreviationPreview | null;
  initialError: string | null;
}) {
  const [preview, setPreview] = useState<AbbreviationPreview | null>(
    initialPreview,
  );
  const [code, setCode] = useState(initialPreview?.suggested ?? "");
  const [error, setError] = useState<string | null>(initialError);
  const [pending, setPending] = useState(false);
  const [finding, setFinding] = useState(false);
  const [lookup, setLookup] = useState<AbbreviationLookup | null>(null);
  const [understood, setUnderstood] = useState(false);
  const lookupSeq = useRef(0);
  const locked = preview?.locked === true;

  useEffect(() => {
    if (locked) {
      return;
    }
    const normalized = normalizeAbbreviationDraft(code);
    if (normalized.length === 0) {
      lookupSeq.current += 1;
      setFinding(false);
      setLookup(null);
      return;
    }

    const seq = lookupSeq.current + 1;
    lookupSeq.current = seq;
    setFinding(true);

    const timer = window.setTimeout(() => {
      void readSettingsAbbreviationAction(normalized).then((result) => {
        if (lookupSeq.current !== seq) {
          return;
        }
        if (!result.ok) {
          setFinding(false);
          setError(result.error);
          return;
        }
        setPreview(result.preview);
        setLookup(result.preview.lookup ?? null);
        setFinding(false);
      });
    }, ABBREVIATION_LOOKUP_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [code, locked]);

  const examples = preview?.examples;
  const displayCode = locked
    ? (preview?.abbreviation ?? "")
    : normalizeAbbreviationDraft(code);
  const taken = lookup !== null && lookup.available === false;
  const canSubmit =
    !locked &&
    understood &&
    displayCode.length === 3 &&
    !taken &&
    !finding &&
    !pending;

  async function submit(): Promise<void> {
    setPending(true);
    try {
      const result = await claimSettingsAbbreviationAction(
        displayCode,
        understood,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPreview(result.preview);
      setError(null);
      setUnderstood(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full">
      <FirstLoginKicker className="mb-5">School IDs</FirstLoginKicker>
      <h1 className="mb-4 font-newsreader text-[clamp(32px,4vw,44px)] font-light leading-[1.1] tracking-[-0.03em] text-site-ink">
        Three letters on every ID
      </h1>
      <p className="mb-10 max-w-[46ch] text-[17px] leading-[1.65] text-site-body">
        No two schools share a code. The first save is the last. Teachers get
        T, students will get S. The school never types the number.
      </p>

      {locked ? (
        <div className="w-full max-w-[36rem] border border-site-line bg-site-canvas px-5 py-5">
          <div className="mb-2 font-mono text-[10px] tracking-[0.16em] uppercase text-site-muted">
            Locked
          </div>
          <div className="mb-4 font-mono text-[28px] tracking-[0.16em] text-site-ink">
            {displayCode}
          </div>
          <div className="font-mono text-[15px] text-site-ink">
            {examples?.teacher ?? `${displayCode}T/00001/26`}
          </div>
          <div className="mt-1 font-mono text-[15px] text-site-ink">
            {examples?.student ?? `${displayCode}S/00001/26`}
          </div>
          <p className="mt-5 text-[16px] leading-[1.55] text-site-body">
            These letters cannot be changed.
          </p>
        </div>
      ) : (
        <form
          className="flex w-full max-w-[36rem] flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <FirstLoginFieldLabel htmlFor="settings-abbreviation">
            Three letters
          </FirstLoginFieldLabel>
          <FirstLoginTextInput
            id="settings-abbreviation"
            name="abbreviation"
            autoComplete="off"
            spellCheck={false}
            required
            maxLength={3}
            value={code}
            onChange={(event) => {
              setCode(normalizeAbbreviationDraft(event.target.value));
            }}
            disabled={pending}
            placeholder="AAA"
            className="mb-5 font-mono tracking-[0.2em] uppercase"
          />

          <div className="mb-8 border border-site-line bg-site-canvas px-4 py-4">
            <div className="mb-2 font-mono text-[10px] tracking-[0.16em] uppercase text-site-muted">
              ID preview
            </div>
            <div className="font-mono text-[16px] text-site-ink">
              {examples?.teacher ?? "AAAT/00001/26"}
            </div>
            <div className="mt-1 font-mono text-[16px] text-site-ink">
              {examples?.student ?? "AAAS/00001/26"}
            </div>
            <div className="mt-1 font-mono text-[16px] text-site-ink">
              {examples?.staff ?? "AAAF/00001/26"}
            </div>
            <div className="mt-3 min-h-[1.4em] font-mono text-[12.5px] text-site-muted">
              {finding
                ? "Checking that code…"
                : taken
                  ? "That code is taken."
                  : displayCode.length < 3
                    ? "Use exactly three letters A–Z."
                    : "This code is ready to save."}
            </div>
          </div>

          <div className="mb-8 border-2 border-site-brick bg-site-canvas px-5 py-5">
            <FirstLoginKicker className="mb-3">Permanent</FirstLoginKicker>
            <p className="mb-5 text-[17px] leading-[1.55] text-site-ink">
              Saving locks these letters for life. Existing IDs are never
              rewritten.
            </p>
            <FirstLoginCheckbox
              id="settings-abbreviation-permanent"
              checked={understood}
              disabled={pending}
              onChange={(event) => {
                setUnderstood(event.target.checked);
              }}
            >
              I understand. This abbreviation cannot be changed.
            </FirstLoginCheckbox>
          </div>

          <FirstLoginError error={error} />
          <FirstLoginPrimaryButton
            type="submit"
            disabled={!canSubmit}
            className={pending ? "w-full disabled:cursor-wait" : "w-full"}
          >
            {pending ? "Saving…" : "Save these letters"}
          </FirstLoginPrimaryButton>
        </form>
      )}
    </div>
  );
}
