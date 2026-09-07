"use client";

import Link from "next/link";
import {
  featuredSchoolHost,
  type FeaturedSchool,
} from "@/features/school-site/featured-schools";
import { useFeaturedSchools } from "@/features/school-site/use-featured-schools";
import { slugifySchoolName } from "@/lib/network";
import { useFeaturedSchoolsStore } from "@/stores/featured-schools-store";
import {
  ConsoleFieldLabel,
  ConsoleGhostButton,
  ConsoleKicker,
  ConsolePrimaryButton,
  ConsoleTextInput,
} from "./console-ui";

type FeaturedSchoolsViewProps = {
  rootHost: string;
  initialSchools: FeaturedSchool[];
  initialError: string | null;
};

export function FeaturedSchoolsView({
  rootHost,
  initialSchools,
  initialError,
}: FeaturedSchoolsViewProps) {
  const { schools, status, error, setError, addSchool, removeSchool } =
    useFeaturedSchools(initialSchools);
  const name = useFeaturedSchoolsStore((state) => state.draftName);
  const slug = useFeaturedSchoolsStore((state) => state.draftSlug);
  const slugEdited = useFeaturedSchoolsStore((state) => state.slugEdited);
  const flash = useFeaturedSchoolsStore((state) => state.flash);
  const removingId = useFeaturedSchoolsStore((state) => state.removingId);
  const setDraftName = useFeaturedSchoolsStore((state) => state.setDraftName);
  const setDraftSlug = useFeaturedSchoolsStore((state) => state.setDraftSlug);
  const setSlugEdited = useFeaturedSchoolsStore((state) => state.setSlugEdited);
  const setFlash = useFeaturedSchoolsStore((state) => state.setFlash);
  const setRemovingId = useFeaturedSchoolsStore((state) => state.setRemovingId);
  const resetDraft = useFeaturedSchoolsStore((state) => state.resetDraft);
  const pending = status === "loading";
  const formError = error;

  return (
    <div className="mx-auto w-full max-w-[1060px] flex-1 px-7 pb-[100px] pt-11">
      <Link
        href="/platform-admin"
        className="mb-[26px] inline-block font-spline-mono text-[11px] tracking-[0.1em] uppercase text-console-muted hover:text-console-accent"
      >
        ← Console home
      </Link>

      <div className="mb-[30px] flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="m-0 text-[34px] font-medium leading-none tracking-[-0.025em]">
            Featured schools
          </h1>
          <p className="mt-3 max-w-[52ch] text-[14.5px] leading-relaxed text-console-muted">
            Names listed here appear on {rootHost} under Schools on the network.
            This is the landing directory, not tenant provisioning.
          </p>
        </div>
      </div>

      {initialError !== null ? (
        <div className="mb-[22px] flex items-center gap-3 border-l-2 border-console-danger bg-console-surface px-3.5 py-3">
          <span className="font-spline-mono text-[12.5px] text-console-danger-deep">
            {initialError}
          </span>
        </div>
      ) : null}

      {flash.length > 0 ? (
        <div className="mb-[22px] flex items-center gap-3 border-l-2 border-console-accent bg-console-surface px-3.5 py-3">
          <span className="font-spline-mono text-[12.5px] text-console-accent-deep">
            {flash}
          </span>
        </div>
      ) : null}

      <section className="mb-14 grid grid-cols-1 items-start gap-16 lg:grid-cols-2">
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setFlash("");
            const result = await addSchool(name, slug);
            if (result !== null) {
              return;
            }
            const nextSlug = slugifySchoolName(slug);
            setFlash(`${nextSlug}.${rootHost} added to the landing directory`);
            resetDraft();
          }}
        >
          <ConsoleKicker className="mb-5 tracking-[0.14em]">
            Add a school
          </ConsoleKicker>

          <ConsoleFieldLabel htmlFor="featured-name">School name</ConsoleFieldLabel>
          <ConsoleTextInput
            id="featured-name"
            value={name}
            placeholder="North Hall"
            className="mb-[30px] text-base"
            disabled={pending}
            onChange={(event) => {
              const next = event.target.value;
              setDraftName(next);
              setError(null);
              setFlash("");
              if (!slugEdited) {
                setDraftSlug(slugifySchoolName(next));
              }
            }}
          />

          <ConsoleFieldLabel htmlFor="featured-slug">
            Subdomain slug
          </ConsoleFieldLabel>
          <ConsoleTextInput
            id="featured-slug"
            value={slug}
            placeholder="north-hall"
            className="font-spline-mono tracking-[0.01em]"
            disabled={pending}
            onChange={(event) => {
              setDraftSlug(slugifySchoolName(event.target.value));
              setSlugEdited(true);
              setError(null);
              setFlash("");
            }}
          />
          <div className="mt-2.5 font-spline-mono text-[11px] leading-[1.7] text-console-faint">
            shown as {slug.length > 0 ? slug : "slug"}.{rootHost}
          </div>

          {formError !== null ? (
            <div className="mt-5 border-l-2 border-console-danger py-3 pl-3">
              <div className="mb-1.5 font-spline-mono text-[10px] tracking-[0.14em] uppercase text-console-danger">
                Cannot publish
              </div>
              <div className="font-spline-mono text-[12.5px] leading-relaxed text-console-danger-deep">
                {formError}
              </div>
            </div>
          ) : null}

          <div className="mt-9 flex gap-3">
            <ConsolePrimaryButton type="submit" disabled={pending}>
              {pending ? "Saving…" : "Add to directory"}
            </ConsolePrimaryButton>
            <ConsoleGhostButton
              type="button"
              disabled={pending}
              onClick={() => {
                resetDraft();
              }}
            >
              Clear
            </ConsoleGhostButton>
          </div>
        </form>

        <div className="border-t border-console-line-strong pt-[22px]">
          <ConsoleKicker className="mb-5 tracking-[0.14em]">
            Address preview
          </ConsoleKicker>
          <div className="break-all font-spline-mono text-[26px] leading-[1.35] tracking-[-0.01em]">
            <span className="text-console-accent">
              {slug.length > 0 ? slug : "your-slug"}
            </span>
            <span className="text-console-faint">.{rootHost}</span>
          </div>
          <p className="mt-[26px] max-w-[38ch] border-t border-console-line pt-[18px] text-sm leading-[1.7] text-console-muted">
            Guests see this row on the network home. Adding it here does not
            create a tenant or open a campus.
          </p>
        </div>
      </section>

      <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1.5fr)_132px] items-center gap-4 border-b border-console-line-strong py-3 font-spline-mono text-[10px] tracking-[0.14em] uppercase text-console-muted md:grid">
        <div>School</div>
        <div>Address</div>
        <div className="text-right">Action</div>
      </div>

      {schools.map((school) => (
        <div
          key={school.id.length > 0 ? school.id : school.slug}
          className="grid grid-cols-1 items-center gap-3 border-b border-console-line py-[19px] md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.5fr)_132px] md:gap-4"
        >
          <div className="text-[16.5px] tracking-[-0.01em]">{school.name}</div>
          <div className="overflow-hidden text-ellipsis whitespace-nowrap font-spline-mono text-[12.5px] text-console-muted">
            {featuredSchoolHost(school, rootHost)}
          </div>
          <div className="text-left md:text-right">
            <button
              type="button"
              disabled={pending}
              onClick={async () => {
                setFlash("");
                setRemovingId(school.id);
                const result = await removeSchool(school.id);
                setRemovingId(null);
                if (result !== null) {
                  return;
                }
                setFlash(
                  `${featuredSchoolHost(school, rootHost)} removed from the landing directory`,
                );
              }}
              className="cursor-pointer border border-console-line bg-transparent px-3 py-2 font-spline-mono text-[11px] tracking-[0.1em] uppercase text-console-danger hover:border-console-danger disabled:cursor-not-allowed disabled:opacity-60"
            >
              {removingId === school.id ? "Removing…" : "Unpublish"}
            </button>
          </div>
        </div>
      ))}

      {schools.length === 0 ? (
        <div className="border-b border-console-line px-0 py-16 text-center">
          <div className="font-spline-mono text-[12.5px] tracking-[0.04em] text-console-muted">
            No schools yet
          </div>
        </div>
      ) : null}

      <div className="mt-[18px] font-spline-mono text-[11px] text-console-faint">
        {schools.length} featured on the network home
      </div>
    </div>
  );
}
