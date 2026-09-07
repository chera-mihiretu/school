import type { ReactNode } from "react";
import { cn } from "./cn";

type NetworkMarkProps = {
  size?: number;
  className?: string;
  decorative?: boolean;
};

function MarkGeometry() {
  return (
    <>
      <line
        x1="16"
        y1="12.4"
        x2="16"
        y2="7.6"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <line
        x1="19.6"
        y1="16"
        x2="24.4"
        y2="16"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <line
        x1="16"
        y1="19.6"
        x2="16"
        y2="24.4"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <line
        x1="12.4"
        y1="16"
        x2="7.6"
        y2="16"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <rect
        x="12.4"
        y="12.4"
        width="7.2"
        height="7.2"
        rx="1.6"
        fill="currentColor"
      />
      <rect
        x="13.4"
        y="2.4"
        width="5.2"
        height="5.2"
        rx="1.2"
        fill="currentColor"
      />
      <rect
        x="24.4"
        y="13.4"
        width="5.2"
        height="5.2"
        rx="1.2"
        fill="currentColor"
      />
      <rect
        x="13.4"
        y="24.4"
        width="5.2"
        height="5.2"
        rx="1.2"
        fill="currentColor"
      />
      <rect
        x="2.4"
        y="13.4"
        width="5.2"
        height="5.2"
        rx="1.2"
        fill="currentColor"
      />
    </>
  );
}

export function NetworkMark({
  size = 24,
  className,
  decorative = true,
}: NetworkMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={cn("block shrink-0", className)}
      role="img"
      aria-hidden={decorative}
      aria-label={decorative ? undefined : "School"}
    >
      <MarkGeometry />
    </svg>
  );
}

export function NetworkLockup({
  href,
  className,
  markSize = 26,
}: {
  href?: string;
  className?: string;
  markSize?: number;
}) {
  const body = (
    <>
      <NetworkMark size={markSize} decorative />
      <span className="font-bricolage text-[19px] font-semibold leading-none tracking-[-0.03em]">
        School
      </span>
    </>
  );

  const lockupClass = cn(
    "inline-flex items-center gap-[11px] no-underline",
    className,
  );

  if (href === undefined) {
    return <span className={lockupClass}>{body}</span>;
  }

  return (
    <a href={href} className={lockupClass}>
      {body}
    </a>
  );
}

export function NetworkCredit({
  className,
  children = "Part of the School network",
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <p
      className={cn(
        "m-0 flex items-center gap-2 font-bricolage text-[11px] tracking-[0.03em]",
        className,
      )}
    >
      <NetworkMark size={13} decorative />
      <span>{children}</span>
    </p>
  );
}
