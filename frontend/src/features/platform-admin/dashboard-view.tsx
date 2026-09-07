"use client";

import type { ReactNode } from "react";
import { schoolHostLabel } from "@/lib/network";
import { useConsoleStore } from "@/stores/console-store";
import {
  displayDashboardDate,
  type AdminDashboardStats,
} from "./dashboard";
import { ConsoleKicker, ConsolePrimaryLink, StatusDot } from "./console-ui";

export function DashboardView({
  rootHost,
  pendingMessages,
  stats,
}: {
  rootHost: string;
  pendingMessages: number;
  stats: AdminDashboardStats;
}) {
  const events = useConsoleStore((state) => state.events);
  const total = stats.schoolCount;
  const active = stats.activeCount;
  const suspended = stats.suspendedCount;
  const pending = stats.pendingSetupCount;
  const sessionHint =
    pending > 0
      ? `${active} active · ${pending} pending · ${suspended} suspended`
      : `${active} active · ${suspended} suspended`;

  const yearKeys = Object.keys(stats.createdByYear).sort();
  const yearMax = yearKeys.reduce(
    (max, key) => Math.max(max, stats.createdByYear[key] ?? 0),
    1,
  );

  return (
    <div className="mx-auto w-full max-w-[1060px] flex-1 px-7 pb-[100px] pt-14">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6 animate-ome-rise">
        <div>
          <ConsoleKicker className="mb-3.5">Signed in</ConsoleKicker>
          <h1 className="m-0 text-[40px] font-medium leading-[1.05] tracking-[-0.025em]">
            Dashboard
          </h1>
        </div>
        {pendingMessages > 0 ? (
          <ConsolePrimaryLink href="/platform-admin/messages">
            Act on {pendingMessages}{" "}
            {pendingMessages === 1 ? "message" : "messages"}
          </ConsolePrimaryLink>
        ) : (
          <ConsolePrimaryLink href="/platform-admin/schools/new">
            Create a school
          </ConsolePrimaryLink>
        )}
      </div>

      <div className="mb-[54px] grid grid-cols-2 border-t border-console-line-strong sm:grid-cols-4 animate-ome-rise-delay-1">
        <Stat label="Schools" value={String(total)} />
        <Stat
          label="Active"
          value={String(active)}
          valueClassName="text-console-accent-deep"
        />
        <Stat
          label="Suspended"
          value={String(suspended)}
          valueClassName="text-console-danger-deep"
        />
        <Stat
          label="Serving"
          value={
            <>
              {stats.servingPercent}
              <span className="text-[22px] text-console-faint">%</span>
            </>
          }
        />
      </div>

      <div className="mb-1 grid grid-cols-1 gap-[46px] lg:grid-cols-2 animate-ome-rise-delay-2">
        <section>
          <div className="mb-0 flex items-baseline justify-between gap-4 border-b border-console-line-strong pb-3.5">
            <ConsoleKicker className="tracking-[0.14em]">Schools created</ConsoleKicker>
            <div className="font-spline-mono text-[11px] text-console-faint">by year</div>
          </div>
          <div className="flex items-end gap-[18px] pt-[22px]">
            {yearKeys.length === 0 ? (
              <div className="flex h-[150px] items-end font-spline-mono text-xs text-console-faint">
                No records yet.
              </div>
            ) : (
              yearKeys.map((year) => {
                const count = stats.createdByYear[year] ?? 0;
                const height = Math.max(6, Math.round((count / yearMax) * 100));
                return (
                  <div key={year} className="max-w-[74px] flex-1">
                    <div className="flex h-[150px] flex-col justify-end">
                      <div className="mb-[7px] font-spline-mono text-xs tabular-nums text-console-muted">
                        {count}
                      </div>
                      <div
                        className="bg-console-accent"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <div className="border-t border-console-line pt-[9px] font-spline-mono text-[11px] text-console-faint">
                      {year}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section>
          <div className="flex items-baseline justify-between gap-4 border-b border-console-line-strong pb-3.5">
            <ConsoleKicker className="tracking-[0.14em]">Status</ConsoleKicker>
            <div className="font-spline-mono text-[11px] text-console-faint">
              {sessionHint}
            </div>
          </div>
          <div className="mt-[22px] mb-4 flex h-3 gap-0.5 bg-console-line">
            <div
              className="bg-console-accent"
              style={{ width: `${total === 0 ? 0 : (active / total) * 100}%` }}
            />
            <div
              className="bg-console-faint"
              style={{ width: `${total === 0 ? 0 : (pending / total) * 100}%` }}
            />
            <div
              className="bg-console-danger"
              style={{ width: `${total === 0 ? 0 : (suspended / total) * 100}%` }}
            />
          </div>
          <div className="mb-[34px] flex flex-wrap gap-6 font-spline-mono text-[11px] text-console-muted">
            <span className="flex items-center gap-2">
              <StatusDot status="active" />
              Active
            </span>
            {pending > 0 ? (
              <span className="flex items-center gap-2">
                <StatusDot status="pending_setup" />
                Pending
              </span>
            ) : null}
            <span className="flex items-center gap-2">
              <StatusDot status="suspended" />
              Suspended
            </span>
          </div>
          <ConsoleKicker className="border-b border-console-line pb-3 tracking-[0.14em]">
            Newest addresses
          </ConsoleKicker>
          {stats.newest.length === 0 ? (
            <div className="border-b border-console-line py-6 font-spline-mono text-xs text-console-faint">
              No schools yet.
            </div>
          ) : (
            stats.newest.map((school) => (
              <div
                key={school.id}
                className="grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-3 border-b border-console-line py-3"
              >
                <StatusDot status={school.status} size={6} />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap font-spline-mono text-[12.5px] text-console-muted">
                  {schoolHostLabel(school.slug, rootHost) ??
                    school.email ??
                    "Setup pending"}
                </span>
                <span className="font-spline-mono text-[11px] tabular-nums text-console-faint">
                  {displayDashboardDate(school.created)}
                </span>
              </div>
            ))
          )}
        </section>
      </div>

      <section className="mt-[58px] animate-ome-rise-delay-3">
        <div className="flex items-baseline justify-between gap-5 border-b border-console-line-strong pb-3">
          <ConsoleKicker className="tracking-[0.14em]">This session</ConsoleKicker>
          <div className="font-spline-mono text-[11px] text-console-faint">
            {sessionHint}
          </div>
        </div>
        {events.length === 0 ? (
          <div className="border-b border-console-line py-6 font-spline-mono text-xs text-console-faint">
            No operator actions yet this session.
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="grid grid-cols-[76px_10px_minmax(0,1fr)] items-center gap-3.5 border-b border-console-line py-[13px]"
            >
              <span className="font-spline-mono text-[11.5px] tabular-nums text-console-faint">
                {event.t}
              </span>
              <StatusDot
                status={event.kind === "danger" ? "suspended" : "active"}
                size={6}
              />
              <span className="text-[14.5px] leading-[1.45]">{event.text}</span>
            </div>
          ))
        )}
      </section>

      <div className="mt-14 grid grid-cols-1 gap-6 border-t border-console-line pt-[18px] sm:grid-cols-[180px_minmax(0,1fr)]">
        <ConsoleKicker className="tracking-[0.12em]">Not in this console</ConsoleKicker>
        <p className="m-0 max-w-[62ch] font-spline-mono text-xs leading-[1.9] text-console-muted">
          Grades, attendance and classes · signing in as a school user · editing a
          campus site · permanent deletion of a school or its data.
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="border-b border-console-line px-0 py-5 sm:border-l sm:px-[26px] sm:first:border-l-0 sm:first:px-0">
      <ConsoleKicker className="mb-3 tracking-[0.12em]">{label}</ConsoleKicker>
      <div
        className={`text-[50px] font-light leading-none tracking-[-0.03em] tabular-nums ${valueClassName ?? ""}`}
      >
        {value}
      </div>
    </div>
  );
}
