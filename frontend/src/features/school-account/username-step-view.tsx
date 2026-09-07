"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFirstLoginStore } from "@/stores/first-login-store";
import { slugifySchoolName } from "@/lib/network";
import {
  claimSchoolUsernameAction,
  lookupSchoolUsernameAction,
} from "./actions";
import { USERNAME_LOOKUP_DEBOUNCE_MS } from "./constants";
import {
  FirstLoginCheckbox,
  FirstLoginError,
  FirstLoginFieldLabel,
  FirstLoginFrame,
  FirstLoginKicker,
  FirstLoginPrimaryButton,
  FirstLoginTextInput,
  UsernameFindingLabel,
} from "./first-login-ui";
import type { SchoolSessionView, UsernameLookup } from "./school-account";

export function UsernameStepView({
  initialSession,
  rootHost,
}: {
  initialSession: SchoolSessionView;
  rootHost: string;
}) {
  const slug = useFirstLoginStore((state) => state.slug);
  const finding = useFirstLoginStore((state) => state.finding);
  const availability = useFirstLoginStore((state) => state.availability);
  const understoodPermanent = useFirstLoginStore(
    (state) => state.understoodPermanent,
  );
  const error = useFirstLoginStore((state) => state.error);
  const pending = useFirstLoginStore((state) => state.pending);
  const setSlug = useFirstLoginStore((state) => state.setSlug);
  const setFinding = useFirstLoginStore((state) => state.setFinding);
  const setAvailability = useFirstLoginStore((state) => state.setAvailability);
  const setUnderstoodPermanent = useFirstLoginStore(
    (state) => state.setUnderstoodPermanent,
  );
  const setError = useFirstLoginStore((state) => state.setError);
  const setPending = useFirstLoginStore((state) => state.setPending);
  const applySession = useFirstLoginStore((state) => state.applySession);
  const lookupSeq = useRef(0);
  const router = useRouter();

  useEffect(() => {
    applySession(initialSession);
  }, [applySession, initialSession]);

  useEffect(() => {
    const normalized = slugifySchoolName(slug);
    if (normalized.length === 0) {
      lookupSeq.current += 1;
      setFinding(false);
      setAvailability(null);
      return;
    }

    const seq = lookupSeq.current + 1;
    lookupSeq.current = seq;
    setFinding(true);

    const timer = window.setTimeout(() => {
      void lookupSchoolUsernameAction(normalized).then((result) => {
        if (lookupSeq.current !== seq) {
          return;
        }
        if (!result.ok) {
          setFinding(false);
          setError(result.error);
          return;
        }
        setAvailability(result.lookup);
      });
    }, USERNAME_LOOKUP_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [setAvailability, setError, setFinding, slug]);

  const previewSlug = slugifySchoolName(slug);
  const previewHost =
    previewSlug.length > 0 ? `${previewSlug}.${rootHost}` : `{username}.${rootHost}`;
  const addressReady =
    !finding && availability !== null && availability.available;
  const canSubmit = understoodPermanent && addressReady && !pending;

  async function submitClaim(): Promise<void> {
    if (!understoodPermanent) {
      setError("Confirm that this address cannot be changed.");
      return;
    }
    if (availability === null || !availability.available) {
      setError("Choose a username that is free.");
      return;
    }

    setPending(true);
    try {
      const result = await claimSchoolUsernameAction(
        previewSlug,
        understoodPermanent,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(result.nextPath);
    } finally {
      setPending(false);
    }
  }

  return (
    <FirstLoginFrame wide>
      <FirstLoginKicker className="mb-[22px]">Step 2 of 3</FirstLoginKicker>
      <h1 className="mb-4 max-w-[16ch] text-[clamp(40px,6vw,68px)] font-light leading-[1.02] tracking-[-0.035em]">
        Choose the address you will keep.
      </h1>
      <p className="mb-12 max-w-[42ch] text-[18.5px] leading-[1.65] text-site-body">
        This is your school’s home on the network. It is the only username you
        get. Once it is set, it cannot be renamed, moved, or reused.
      </p>

      <form
        className="flex max-w-[480px] flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          void submitClaim();
        }}
      >
        <FirstLoginFieldLabel htmlFor="school-username">
          Username
        </FirstLoginFieldLabel>
        <FirstLoginTextInput
          id="school-username"
          name="username"
          autoComplete="off"
          spellCheck={false}
          required
          value={slug}
          onChange={(event) => {
            setSlug(slugifySchoolName(event.target.value));
          }}
          disabled={pending}
          placeholder="north-hall"
          className="mb-5 font-mono tracking-[0.01em]"
        />

        <div className="mb-8 border border-site-line bg-site-canvas px-4 py-4">
          <div className="mb-2 font-mono text-[10px] tracking-[0.16em] uppercase text-site-muted">
            Address preview
          </div>
          <div className="break-all font-mono text-[16px] tracking-[0.01em] text-site-ink">
            {previewHost}
          </div>
          <div className="mt-3 min-h-[1.4em] font-mono text-[12.5px] text-site-muted">
            <UsernameAvailabilityStatus
              slug={previewSlug}
              finding={finding}
              availability={availability}
            />
          </div>
        </div>

        <div className="mb-8 border-2 border-site-brick bg-site-canvas px-5 py-5">
          <FirstLoginKicker className="mb-3">Permanent</FirstLoginKicker>
          <p className="mb-5 text-[17px] leading-[1.55] text-site-ink">
            After you continue, this school lives at{" "}
            <span className="font-mono">{previewHost}</span> forever. Next you
            choose the three letters printed on student and teacher IDs.
          </p>
          <FirstLoginCheckbox
            id="school-username-permanent"
            checked={understoodPermanent}
            disabled={pending}
            onChange={(event) => {
              setUnderstoodPermanent(event.target.checked);
            }}
          >
            I understand. This subdomain cannot be changed.
          </FirstLoginCheckbox>
        </div>

        <FirstLoginError error={error} />
        <FirstLoginPrimaryButton
          type="submit"
          disabled={!canSubmit}
          className={pending ? "mt-2 w-full disabled:cursor-wait" : "mt-2 w-full"}
        >
          {pending ? "Saving this address…" : "Claim this address"}
        </FirstLoginPrimaryButton>
      </form>
    </FirstLoginFrame>
  );
}

function UsernameAvailabilityStatus({
  slug,
  finding,
  availability,
}: {
  slug: string;
  finding: boolean;
  availability: UsernameLookup | null;
}) {
  if (slug.length === 0) {
    return <span>Type a username to see the address.</span>;
  }
  if (finding) {
    return <UsernameFindingLabel />;
  }
  if (availability === null) {
    return <span>Checking that address…</span>;
  }
  if (availability.available) {
    return <span className="text-site-ink">This address is free.</span>;
  }

  switch (availability.reason) {
    case "reserved":
      return <span className="text-site-brick">That name is reserved.</span>;
    case "taken":
      return <span className="text-site-brick">That name is taken.</span>;
    case "invalid":
      return (
        <span className="text-site-brick">
          Use letters, numbers, and single hyphens.
        </span>
      );
    default: {
      const _never: never = availability.reason;
      return _never;
    }
  }
}
