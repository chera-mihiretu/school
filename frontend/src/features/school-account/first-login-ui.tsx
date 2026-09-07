import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/features/ui/cn";

const fieldControlClassName =
  "w-full rounded-none border border-site-line bg-site-hatch px-3.5 py-3 font-newsreader text-[18px] text-site-ink outline-none placeholder:text-site-muted/70 focus:border-site-brick focus:ring-1 focus:ring-site-brick disabled:cursor-not-allowed disabled:bg-site-hatch disabled:opacity-60";

const fieldLabelClassName =
  "mb-2 block font-mono text-[12px] tracking-[0.1em] uppercase text-site-ink";

export type FirstLoginFrameSize = "default" | "wide" | "console";

function frameMaxWidth(size: FirstLoginFrameSize): string {
  switch (size) {
    case "default":
      return "w-full max-w-[440px]";
    case "wide":
      return "w-full max-w-[560px]";
    case "console":
      return "w-full max-w-[720px]";
    default: {
      const _never: never = size;
      return _never;
    }
  }
}

export function FirstLoginKicker({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "font-mono text-[10px] tracking-[0.16em] uppercase text-site-brick",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FirstLoginFieldLabel({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={cn(fieldLabelClassName, className)} />;
}

export function FirstLoginTextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className={cn(fieldControlClassName, className)} />
  );
}

export function FirstLoginTextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(fieldControlClassName, "min-h-[88px] resize-y", className)}
    />
  );
}

export function FirstLoginCheckbox({
  id,
  children,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  id: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-11 cursor-pointer items-start gap-3 py-1"
    >
      <input
        {...props}
        id={id}
        type="checkbox"
        className={cn(
          "mt-1 h-5 w-5 shrink-0 cursor-pointer accent-site-brick disabled:cursor-not-allowed",
          className,
        )}
      />
      <span className="pt-0.5 text-[16px] leading-[1.5] text-site-ink">
        {children}
      </span>
    </label>
  );
}

export function FirstLoginRadio({
  id,
  children,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  id: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-11 cursor-pointer items-center gap-3 font-newsreader text-[18px] text-site-ink"
    >
      <input
        {...props}
        id={id}
        type="radio"
        className={cn(
          "h-5 w-5 shrink-0 cursor-pointer accent-site-brick disabled:cursor-not-allowed",
          className,
        )}
      />
      {children}
    </label>
  );
}

export function FirstLoginPrimaryButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "cursor-pointer border-0 bg-site-brick px-[26px] py-[15px] font-bricolage text-[13.5px] text-site-on-brick hover:bg-site-brick-deep disabled:cursor-not-allowed disabled:opacity-70",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function FirstLoginPrimaryLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center justify-center bg-site-brick px-[26px] py-[15px] font-bricolage text-[13.5px] text-site-on-brick no-underline hover:bg-site-brick-deep",
        className,
      )}
    >
      {children}
    </a>
  );
}

export function FirstLoginGhostButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "cursor-pointer border border-site-line bg-transparent px-[26px] py-[14px] font-bricolage text-[13.5px] text-site-ink hover:border-site-brick disabled:cursor-not-allowed disabled:opacity-70",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function FirstLoginFrame({
  children,
  wide = false,
  size,
}: {
  children: ReactNode;
  wide?: boolean;
  size?: FirstLoginFrameSize;
}) {
  const resolved: FirstLoginFrameSize = size ?? (wide ? "wide" : "default");

  return (
    <main className="flex flex-1 justify-center px-6 pb-16 pt-[10vh] sm:px-10">
      <section className={frameMaxWidth(resolved)}>{children}</section>
    </main>
  );
}

export function FirstLoginError({ error }: { error: string | null }) {
  if (error === null) {
    return null;
  }

  return (
    <div className="mt-6 border-l-2 border-site-brick pl-3">
      <span className="font-mono text-[12.5px] leading-normal text-site-brick">
        {error}
      </span>
    </div>
  );
}

export function UsernameFindingLabel() {
  return (
    <span className="inline-flex items-center username-finding-text">
      Finding username
      <span className="username-finding-dot" />
      <span className="username-finding-dot" />
      <span className="username-finding-dot" />
    </span>
  );
}
