"use client";

import { useEffect, useRef, useState } from "react";
import { useFirstLoginStore } from "@/stores/first-login-store";
import {
  claimAppAbbreviationAction,
  readAppAbbreviationAction,
} from "./actions";
import { ABBREVIATION_LOOKUP_DEBOUNCE_MS } from "./constants";
import {
  FirstLoginCheckbox,
  FirstLoginError,
  FirstLoginFieldLabel,
  FirstLoginFrame,
  FirstLoginKicker,
  FirstLoginPrimaryButton,
  FirstLoginTextInput,
} from "./first-login-ui";
import {
  normalizeAbbreviationDraft,
  type AbbreviationLookup,
  type AbbreviationPreview,
} from "./school-abbreviation";
import type { SchoolSessionView } from "./school-account";

export function AbbreviationStepView({
  initialSession,
}: {
  initialSession: SchoolSessionView;
}) {
  const error = useFirstLoginStore((state) => state.error);
  const pending = useFirstLoginStore((state) => state.pending);
  const setError = useFirstLoginStore((state) => state.setError);
  const setPending = useFirstLoginStore((state) => state.setPending);
  const applySession = useFirstLoginStore((state) => state.applySession);
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<AbbreviationPreview | null>(null);
  const [finding, setFinding] = useState(false);
  const [lookup, setLookup] = useState<AbbreviationLookup | null>(null);
  const [understood, setUnderstood] = useState(false);
  const lookupSeq = useRef(0);

  const hydrated = useRef(false);

  useEffect(() => {
    applySession(initialSession);
  }, [applySession, initialSession]);

  useEffect(() => {
    if (hydrated.current) {
      return;
    }
    hydrated.current = true;
    void readAppAbbreviationAction().then((result) => {
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPreview(result.preview);
      if (result.preview.suggested !== null) {
        setCode(result.preview.suggested);
      }
    });
  }, [setError]);

  useEffect(() => {
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
      void readAppAbbreviationAction(normalized).then((result) => {
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
  }, [code, setError]);

  const examples = preview?.examples;
  const taken = lookup !== null && lookup.available === false;
  const canSubmit =
    understood &&
    normalizeAbbreviationDraft(code).length === 3 &&
    !taken &&
    !finding &&
    !pending;

  async function submit(): Promise<void> {
    if (!understood) {
      setError("Confirm that this abbreviation cannot be changed.");
      return;
    }
    setPending(true);
    try {
      const result = await claimAppAbbreviationAction(
        normalizeAbbreviationDraft(code),
        understood,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.assign(result.redirectUrl);
    } finally {
      setPending(false);
    }
  }

  return (
    <FirstLoginFrame wide>
      <FirstLoginKicker className="mb-[22px]">Step 3 of 3</FirstLoginKicker>
      <h1 className="mb-4 max-w-[16ch] text-[clamp(40px,6vw,68px)] font-light leading-[1.02] tracking-[-0.035em]">
        Choose the letters on every school ID.
      </h1>
      <p className="mb-12 max-w-[42ch] text-[18.5px] leading-[1.65] text-site-body">
        First school to save gets AAA, then AAB, and so on. You may type a
        different unused code. This save is permanent.
      </p>

      <form
        className="flex max-w-[480px] flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <FirstLoginFieldLabel htmlFor="school-abbreviation">
          Three letters
        </FirstLoginFieldLabel>
        <FirstLoginTextInput
          id="school-abbreviation"
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
          <div className="font-mono text-[16px] tracking-[0.01em] text-site-ink">
            {examples === null || examples === undefined
              ? "AAAT/00001/26"
              : examples.teacher}
          </div>
          <div className="mt-1 font-mono text-[16px] tracking-[0.01em] text-site-ink">
            {examples === null || examples === undefined
              ? "AAAS/00001/26"
              : examples.student}
          </div>
          <div className="mt-1 font-mono text-[16px] tracking-[0.01em] text-site-ink">
            {examples === null || examples === undefined
              ? "AAAF/00001/26"
              : (examples.staff ?? "AAAF/00001/26")}
          </div>
          <div className="mt-3 min-h-[1.4em] font-mono text-[12.5px] text-site-muted">
            <AbbreviationStatus
              code={normalizeAbbreviationDraft(code)}
              finding={finding}
              lookup={lookup}
            />
          </div>
        </div>

        <div className="mb-8 border-2 border-site-brick bg-site-canvas px-5 py-5">
          <FirstLoginKicker className="mb-3">Permanent</FirstLoginKicker>
          <p className="mb-5 text-[17px] leading-[1.55] text-site-ink">
            After you continue, these three letters stay on this school forever.
            Teachers get T IDs. Staff get F IDs. Students will get S IDs later.
            There is no second change.
          </p>
          <FirstLoginCheckbox
            id="school-abbreviation-permanent"
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
          className={pending ? "mt-2 w-full disabled:cursor-wait" : "mt-2 w-full"}
        >
          {pending ? "Opening your campus…" : "Save these letters"}
        </FirstLoginPrimaryButton>
      </form>
    </FirstLoginFrame>
  );
}

function AbbreviationStatus({
  code,
  finding,
  lookup,
}: {
  code: string;
  finding: boolean;
  lookup: AbbreviationLookup | null;
}) {
  if (code.length === 0) {
    return <span>Type three letters, or keep the suggested code.</span>;
  }
  if (finding) {
    return <span>Checking that code…</span>;
  }
  if (code.length < 3) {
    return <span>Use exactly three letters A–Z.</span>;
  }
  if (lookup === null) {
    return <span>This code is ready to save.</span>;
  }
  if (lookup.available) {
    return <span className="text-site-ink">This code is free.</span>;
  }
  switch (lookup.reason) {
    case "taken":
      return <span className="text-site-brick">That code is taken.</span>;
    case "invalid":
      return (
        <span className="text-site-brick">Use exactly three letters A–Z.</span>
      );
    default: {
      const _never: never = lookup.reason;
      return _never;
    }
  }
}
