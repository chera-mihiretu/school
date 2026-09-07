"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { TenantStatus } from "@/lib/network";
import { cn } from "@/features/ui/cn";
import { useConsoleStore } from "@/stores/console-store";
import { useSchoolsListStore } from "@/stores/schools-list-store";
import {
  reactivateTenantAction,
  resendTenantCredentialsAction,
  suspendTenantAction,
} from "./tenants-actions";
import {
  canResendTenantCredentials,
  tenantMailStatusCopy,
  tenantSchoolAddress,
  type TenantSchool,
} from "./tenants";
import {
  ConsoleFieldLabel,
  ConsoleGhostButton,
  ConsoleKicker,
  ConsolePrimaryButton,
  ConsolePrimaryLink,
  ConsoleTextInput,
  StatusDot,
} from "./console-ui";
import { CredentialsSentDialog } from "./resend-sent-dialog";

type SchoolsListViewProps = {
  rootHost: string;
  initialSchools: TenantSchool[];
  page: number;
  pageSize: number;
  total: number;
  initialError: string | null;
};

export function SchoolsListView({
  rootHost,
  initialSchools,
  page,
  pageSize,
  total,
  initialError,
}: SchoolsListViewProps) {
  const [schools, setSchools] = useState(initialSchools);
  const [listError, setListError] = useState(initialError);
  const flash = useConsoleStore((state) => state.flash);
  const setFlash = useConsoleStore((state) => state.setFlash);
  const registerSearch = useConsoleStore((state) => state.registerSearch);
  const filter = useSchoolsListStore((state) => state.filter);
  const sort = useSchoolsListStore((state) => state.sort);
  const query = useSchoolsListStore((state) => state.query);
  const confirm = useSchoolsListStore((state) => state.confirm);
  const typed = useSchoolsListStore((state) => state.typed);
  const setFilter = useSchoolsListStore((state) => state.setFilter);
  const setSort = useSchoolsListStore((state) => state.setSort);
  const setQuery = useSchoolsListStore((state) => state.setQuery);
  const setConfirm = useSchoolsListStore((state) => state.setConfirm);
  const setTyped = useSchoolsListStore((state) => state.setTyped);
  const clearConfirm = useSchoolsListStore((state) => state.clearConfirm);
  const resendPending = useSchoolsListStore((state) => state.resendPending);
  const resendDoneOpen = useSchoolsListStore((state) => state.resendDoneOpen);
  const credentials = useSchoolsListStore((state) => state.credentials);
  const emailSent = useSchoolsListStore((state) => state.emailSent);
  const emailError = useSchoolsListStore((state) => state.emailError);
  const setResendPending = useSchoolsListStore((state) => state.setResendPending);
  const setResendError = useSchoolsListStore((state) => state.setResendError);
  const openResendDone = useSchoolsListStore((state) => state.openResendDone);
  const dismissResendDone = useSchoolsListStore((state) => state.dismissResendDone);

  useEffect(() => {
    setSchools(initialSchools);
    setListError(initialError);
  }, [initialError, initialSchools]);

  useEffect(() => {
    return () => {
      registerSearch(null);
    };
  }, [registerSearch]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (useSchoolsListStore.getState().resendDoneOpen) {
          dismissResendDone();
          return;
        }
        clearConfirm();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [clearConfirm, dismissResendDone]);

  const active = schools.filter((school) => school.status === "active");
  const suspended = schools.filter((school) => school.status === "suspended");

  const rows = useMemo(() => {
    const pool =
      filter === "active" ? active : filter === "suspended" ? suspended : schools;
    const needle = query.trim().toLowerCase();
    const matched =
      needle.length === 0
        ? pool
        : pool.filter((school) =>
            `${school.name} ${school.slug ?? ""} ${school.email ?? ""}`
              .toLowerCase()
              .includes(needle),
          );
    const rank: Record<TenantStatus, number> = {
      active: 0,
      suspended: 1,
      pending_setup: 2,
    };
    return [...matched].sort((left, right) => {
      switch (sort) {
        case "created":
          return right.created.localeCompare(left.created);
        case "status":
          return (
            rank[left.status] - rank[right.status] ||
            left.name.localeCompare(right.name)
          );
        case "name":
          return left.name.localeCompare(right.name);
        default: {
          const _never: never = sort;
          return _never;
        }
      }
    });
  }, [active, filter, query, schools, sort, suspended]);

  const pageCount = Math.max(1, Math.ceil(total / Math.max(pageSize, 1)));
  const emptyLine =
    total === 0
      ? "No schools yet."
      : schools.length === 0
        ? "No schools on this page."
        : query.trim().length > 0
          ? `No school matches “${query.trim()}”.`
          : "No schools match this filter.";

  const suspendToken =
    confirm?.kind === "suspend" ? confirmToken(confirm.school) : "";
  const suspendReady =
    confirm?.kind === "suspend" &&
    suspendToken.length > 0 &&
    typed.trim() === suspendToken;

  return (
    <div className="mx-auto w-full max-w-[1280px] flex-1 px-7 pb-[100px] pt-11">
      <Link
        href="/platform-admin"
        className="mb-[26px] inline-block font-spline-mono text-[11px] tracking-[0.1em] uppercase text-console-muted hover:text-console-accent"
      >
        ← Console home
      </Link>

      <div className="mb-[30px] flex flex-wrap items-end justify-between gap-6">
        <h1 className="m-0 text-[34px] font-medium leading-none tracking-[-0.025em]">
          Schools
        </h1>
        <ConsolePrimaryLink href="/platform-admin/schools/new">
          Create a school
        </ConsolePrimaryLink>
      </div>

      {listError !== null ? (
        <div className="mb-[22px] flex items-center gap-3 border-l-2 border-console-danger bg-console-surface px-3.5 py-3">
          <span className="font-spline-mono text-[12.5px] text-console-danger-deep">
            {listError}
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

      <div className="mb-1 flex gap-[26px]">
        {(
          [
            ["all", `All ${schools.length}`],
            ["active", `Active ${active.length}`],
            ["suspended", `Suspended ${suspended.length}`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "cursor-pointer border-0 border-b-2 bg-transparent pb-2.5 font-spline-mono text-[11px] tracking-[0.1em] uppercase",
              filter === key
                ? "border-console-primary text-console-ink"
                : "border-transparent text-console-faint",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-4 py-4">
        <div className="min-w-[220px] flex-1">
          <ConsoleFieldLabel htmlFor="schools-filter">Filter</ConsoleFieldLabel>
          <ConsoleTextInput
            id="schools-filter"
            ref={(element: HTMLInputElement | null) => {
              registerSearch(element);
            }}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or director email"
            className="font-spline-mono text-[13px]"
          />
        </div>
        <div className="flex items-center gap-2.5">
          <span className="font-spline-mono text-[10px] tracking-[0.14em] uppercase text-console-faint">
            Sort
          </span>
          {(["name", "created", "status"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              className={cn(
                "cursor-pointer border px-2.5 py-1.5 font-spline-mono text-[11px] tracking-[0.04em] capitalize",
                sort === key
                  ? "border-console-line-strong bg-console-primary text-console-on-primary"
                  : "border-console-line bg-transparent text-console-muted",
              )}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden grid-cols-[20px_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1.4fr)_96px_minmax(210px,auto)] items-center gap-4 border-b border-console-line-strong py-3 font-spline-mono text-[10px] tracking-[0.14em] uppercase text-console-muted md:grid">
        <div />
        <div>School</div>
        <div>Address</div>
        <div>Mail</div>
        <div>Created</div>
        <div className="text-right">Action</div>
      </div>

      {rows.map((school) => (
        <div
          key={school.id}
          className="grid grid-cols-[20px_minmax(0,1fr)] items-center gap-4 border-b border-console-line py-[19px] md:grid-cols-[20px_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1.4fr)_96px_minmax(210px,auto)]"
        >
          <StatusDot status={school.status} />
          <div className="text-[16.5px] tracking-[-0.01em]">{school.name}</div>
          <div
            className={cn(
              "col-start-2 overflow-hidden text-ellipsis whitespace-nowrap font-spline-mono text-[12.5px] text-console-muted md:col-start-auto",
              school.status === "suspended" && "text-console-faint line-through",
            )}
          >
            {tenantSchoolAddress(school, rootHost)}
          </div>
          <div className="col-start-2 font-spline-mono text-[12px] leading-snug text-console-muted md:col-start-auto">
            {tenantMailStatusCopy(school)}
          </div>
          <div className="col-start-2 font-spline-mono text-xs tabular-nums text-console-faint md:col-start-auto">
            {school.created.slice(0, 10)}
          </div>
          <div className="col-start-2 flex flex-wrap items-center justify-start gap-2 md:col-start-auto md:justify-end">
            {canResendTenantCredentials(school) ? (
              <button
                type="button"
                disabled={resendPending}
                onClick={() => {
                  void (async () => {
                    setFlash("");
                    setResendError(null);
                    setResendPending(true);
                    try {
                      const result = await resendTenantCredentialsAction(school.id);
                      if (!result.ok) {
                        setListError(result.error);
                        return;
                      }
                      setSchools((current) =>
                        current.map((item) =>
                          item.id === result.school.id ? result.school : item,
                        ),
                      );
                      openResendDone({
                        credentials: result.credentials,
                        emailSent: result.emailSent,
                        ...(result.emailError !== undefined
                          ? { emailError: result.emailError }
                          : {}),
                      });
                    } finally {
                      setResendPending(false);
                    }
                  })();
                }}
                className="cursor-pointer border border-console-line bg-transparent px-3 py-2 font-spline-mono text-[11px] tracking-[0.1em] uppercase text-console-ink hover:border-console-ink disabled:cursor-not-allowed disabled:text-console-faint"
              >
                {resendPending ? "Sending…" : "Resend"}
              </button>
            ) : null}
            {school.status === "suspended" ? (
              <button
                type="button"
                onClick={() => {
                  setFlash("");
                  setConfirm({ kind: "reactivate", school });
                }}
                className="cursor-pointer border border-console-line bg-transparent px-3 py-2 font-spline-mono text-[11px] tracking-[0.1em] uppercase text-console-accent hover:border-console-accent"
              >
                Reactivate
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setFlash("");
                  setTyped("");
                  setConfirm({ kind: "suspend", school });
                }}
                className="cursor-pointer border border-console-line bg-transparent px-3 py-2 font-spline-mono text-[11px] tracking-[0.1em] uppercase text-console-danger hover:border-console-danger"
              >
                Suspend
              </button>
            )}
          </div>
        </div>
      ))}

      {rows.length === 0 ? (
        <div className="border-b border-console-line px-0 py-16 text-center">
          <div className="font-spline-mono text-[12.5px] tracking-[0.04em] text-console-muted">
            {emptyLine}
          </div>
          {total === 0 ? (
            <Link
              href="/platform-admin/schools/new"
              className="mt-[22px] inline-flex cursor-pointer border border-console-line-strong bg-transparent px-5 py-3 font-spline-mono text-[11px] tracking-[0.12em] uppercase text-console-ink hover:bg-console-primary hover:text-console-on-primary"
            >
              Create the first school
            </Link>
          ) : null}
        </div>
      ) : null}

      {total > 0 ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <span className="font-spline-mono text-[11px] text-console-faint">
            Page {page} of {pageCount}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={`/platform-admin/schools?page=${page - 1}`}
                className="cursor-pointer border border-console-line bg-transparent px-3 py-2 font-spline-mono text-[11px] tracking-[0.1em] uppercase text-console-muted hover:border-console-muted"
              >
                Previous
              </Link>
            ) : (
              <span className="border border-console-line px-3 py-2 font-spline-mono text-[11px] tracking-[0.1em] uppercase text-console-faint">
                Previous
              </span>
            )}
            {page < pageCount ? (
              <Link
                href={`/platform-admin/schools?page=${page + 1}`}
                className="cursor-pointer border border-console-line bg-transparent px-3 py-2 font-spline-mono text-[11px] tracking-[0.1em] uppercase text-console-muted hover:border-console-muted"
              >
                Next
              </Link>
            ) : (
              <span className="border border-console-line px-3 py-2 font-spline-mono text-[11px] tracking-[0.1em] uppercase text-console-faint">
                Next
              </span>
            )}
          </div>
        </div>
      ) : null}

      <div className="mt-[18px] font-spline-mono text-[11px] text-console-faint">
        {total} school records · suspension keeps all data · deletion is
        not available in this console
      </div>

      {confirm?.kind === "suspend" ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-console-overlay p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="suspend-title"
            className="w-full max-w-[520px] border-t-[3px] border-console-danger bg-console-surface px-8 py-[30px]"
          >
            <ConsoleKicker className="mb-4 tracking-[0.16em] text-console-danger">
              High-stakes action
            </ConsoleKicker>
            <h2
              id="suspend-title"
              className="mb-1.5 text-[25px] font-medium leading-[1.15] tracking-[-0.02em]"
            >
              Suspend {confirm.school.name}
            </h2>
            <div className="mb-6 font-spline-mono text-[12.5px] text-console-muted">
              {tenantSchoolAddress(confirm.school, rootHost)}
            </div>
            <div className="border-t border-console-line">
              <ConfirmLine danger>
                The public site stops answering at this address.
              </ConfirmLine>
              <ConfirmLine danger>
                Every sign-in for this school stops working.
              </ConfirmLine>
              <ConfirmLine>All school data is kept, untouched.</ConfirmLine>
              <ConfirmLine>
                You can reactivate it from the school list at any time.
              </ConfirmLine>
            </div>
            <div className="mt-6">
              <ConsoleFieldLabel htmlFor="pc-confirm">
                Type {confirmLabel(confirm.school)} to confirm
              </ConsoleFieldLabel>
              <ConsoleTextInput
                id="pc-confirm"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                placeholder={suspendToken}
                className="font-spline-mono"
              />
            </div>
            <div className="mt-[30px] flex gap-3">
              <button
                type="button"
                disabled={!suspendReady}
                onClick={() => {
                  void (async () => {
                    const result = await suspendTenantAction(confirm.school.id);
                    if (!result.ok) {
                      setListError(result.error);
                      return;
                    }
                    setSchools((current) =>
                      current.map((school) =>
                        school.id === result.school.id ? result.school : school,
                      ),
                    );
                    setFlash(
                      `${tenantSchoolAddress(result.school, rootHost)} suspended · data kept`,
                    );
                    setConfirm(null);
                    setTyped("");
                  })();
                }}
                className={cn(
                  "border-0 px-[26px] py-3.5 font-spline-mono text-[11.5px] tracking-[0.14em] uppercase text-white",
                  suspendReady
                    ? "cursor-pointer bg-console-danger-deep"
                    : "cursor-not-allowed bg-console-danger-soft",
                )}
              >
                Suspend school
              </button>
              <ConsoleGhostButton
                type="button"
                onClick={() => {
                  setConfirm(null);
                  setTyped("");
                }}
              >
                Cancel
              </ConsoleGhostButton>
            </div>
          </div>
        </div>
      ) : null}

      {confirm?.kind === "reactivate" ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-console-overlay p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reactivate-title"
            className="w-full max-w-[480px] border-t-[3px] border-console-accent bg-console-surface px-8 py-[30px]"
          >
            <ConsoleKicker className="mb-4 tracking-[0.16em] text-console-accent">
              Reversible
            </ConsoleKicker>
            <h2
              id="reactivate-title"
              className="mb-1.5 text-[25px] font-medium leading-[1.15] tracking-[-0.02em]"
            >
              Reactivate {confirm.school.name}
            </h2>
            <div className="mb-[22px] font-spline-mono text-[12.5px] text-console-muted">
              {tenantSchoolAddress(confirm.school, rootHost)}
            </div>
            <p className="mb-[30px] text-[14.5px] leading-relaxed text-console-muted">
              The campus site answers again and school sign-ins resume, exactly as
              before the suspension.
            </p>
            <div className="flex gap-3">
              <ConsolePrimaryButton
                type="button"
                onClick={() => {
                  void (async () => {
                    const result = await reactivateTenantAction(confirm.school.id);
                    if (!result.ok) {
                      setListError(result.error);
                      return;
                    }
                    setSchools((current) =>
                      current.map((school) =>
                        school.id === result.school.id ? result.school : school,
                      ),
                    );
                    setFlash(
                      `${tenantSchoolAddress(result.school, rootHost)} reactivated · site is live`,
                    );
                    setConfirm(null);
                  })();
                }}
              >
                Reactivate
              </ConsolePrimaryButton>
              <ConsoleGhostButton type="button" onClick={() => setConfirm(null)}>
                Cancel
              </ConsoleGhostButton>
            </div>
          </div>
        </div>
      ) : null}

      <CredentialsSentDialog
        open={resendDoneOpen}
        credentials={credentials}
        emailSent={emailSent}
        emailError={emailError}
        onDismiss={dismissResendDone}
      />
    </div>
  );
}

function confirmToken(school: TenantSchool): string {
  if (school.slug !== null && school.slug.length > 0) {
    return school.slug;
  }
  if (school.email !== null && school.email.length > 0) {
    return school.email;
  }
  return school.name;
}

function confirmLabel(school: TenantSchool): string {
  if (school.slug !== null && school.slug.length > 0) {
    return "the slug";
  }
  if (school.email !== null && school.email.length > 0) {
    return "the email";
  }
  return "the school name";
}

function ConfirmLine({
  children,
  danger = false,
}: {
  children: string;
  danger?: boolean;
}) {
  return (
    <div className="flex gap-3 border-b border-console-line py-3 text-[14.5px] leading-normal">
      <span
        className={cn(
          "font-spline-mono",
          danger ? "text-console-danger" : "text-console-accent",
        )}
      >
        {danger ? "−" : "+"}
      </span>
      <span>{children}</span>
    </div>
  );
}
