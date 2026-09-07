export const CAMPUS_DIRECTOR_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/teachers", label: "Teachers" },
  { href: "/staff", label: "Staff" },
  { href: "/settings", label: "Settings" },
] as const;

export type CampusDirectorNavHref =
  (typeof CAMPUS_DIRECTOR_NAV_ITEMS)[number]["href"];

export function isCampusDirectorNavActive(
  pathname: string,
  href: CampusDirectorNavHref,
): boolean {
  switch (href) {
    case "/dashboard":
      return pathname === "/dashboard";
    case "/teachers":
      return pathname === "/teachers";
    case "/staff":
      return pathname === "/staff";
    case "/settings":
      return pathname === "/settings";
    default: {
      const _never: never = href;
      return _never;
    }
  }
}
