import { cn } from "@/features/ui/cn";

export const CONTACT_PHONE_LOCAL = "0968590369";
export const CONTACT_PHONE_E164 = "+251968590369";
export const CONTACT_PHONE_DISPLAY = "+251 968 590 369";

type ContactPhoneProps = {
  className?: string;
  showLocal?: boolean;
};

export function ContactPhone({
  className,
  showLocal = true,
}: ContactPhoneProps) {
  return (
    <p
      className={cn(
        "m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-[16px] leading-none",
        className,
      )}
    >
      <a
        href={`tel:${CONTACT_PHONE_E164}`}
        className="inline-flex items-center gap-2 text-site-apex-ink no-underline hover:opacity-80"
      >
        <img
          src="/flags/et.svg"
          alt=""
          width={18}
          height={12}
          className="h-3 w-[18px] shrink-0 border border-site-apex-line"
        />
        <span className="font-bricolage tracking-[-0.01em]">
          {CONTACT_PHONE_DISPLAY}
        </span>
      </a>
      {showLocal ? (
        <span className="font-mono text-[12px] tracking-[0.04em] text-site-apex-muted">
          {CONTACT_PHONE_LOCAL}
        </span>
      ) : null}
    </p>
  );
}
