import { publicUrl } from "@/lib/public-url";

export function networkHomeHref(rootHost: string): string {
  if (typeof window === "undefined") {
    return publicUrl();
  }
  const port = window.location.port;
  return `${window.location.protocol}//${rootHost}${port.length > 0 ? `:${port}` : ""}`;
}
