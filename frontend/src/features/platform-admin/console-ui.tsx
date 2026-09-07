import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/features/ui/cn";

const fieldControlClassName =
  "w-full rounded-none border border-console-line bg-console-surface px-3.5 py-2.5 text-[15px] text-console-ink outline-none placeholder:text-console-faint focus:border-console-accent focus:ring-1 focus:ring-console-accent disabled:cursor-not-allowed disabled:opacity-60";

const fieldLabelClassName =
  "mb-2 block font-spline-mono text-[12px] tracking-[0.1em] uppercase text-console-ink";

const primaryClassName =
  "inline-flex cursor-pointer items-center justify-center border-0 bg-console-primary px-5 py-3 font-spline-mono text-[11.5px] tracking-[0.14em] uppercase text-console-on-primary hover:bg-console-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-60";

export function ConsoleKicker({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "font-spline-mono text-[10.5px] tracking-[0.16em] uppercase text-console-muted",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ConsolePrimaryButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={cn(primaryClassName, className)} />;
}

export function ConsolePrimaryLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn(primaryClassName, className)}>
      {children}
    </Link>
  );
}

export function ConsoleGhostButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "cursor-pointer border border-console-line bg-transparent px-[22px] py-3.5 font-spline-mono text-[11.5px] tracking-[0.14em] uppercase text-console-muted hover:border-console-muted",
        className,
      )}
    />
  );
}

export function ConsoleFieldLabel({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={cn(fieldLabelClassName, className)} />;
}

export const ConsoleTextInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function ConsoleTextInput({ className, ...props }, ref) {
  return (
    <input
      {...props}
      ref={ref}
      className={cn(fieldControlClassName, className)}
    />
  );
});

export function ConsoleTextArea({
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

export function StatusDot({
  status,
  size = 7,
}: {
  status: "pending_setup" | "active" | "suspended";
  size?: number;
}) {
  const tone =
    status === "active"
      ? "bg-console-accent"
      : status === "suspended"
        ? "bg-console-danger"
        : "bg-console-faint";
  return (
    <span
      className={cn("inline-block shrink-0", tone)}
      style={{ width: size, height: size }}
    />
  );
}
