export type PublicHostView =
  | { kind: "apex"; host: string; rootHost: string }
  | { kind: "admin"; host: string; rootHost: string }
  | { kind: "app"; host: string; rootHost: string }
  | {
      kind: "campus";
      host: string;
      rootHost: string;
      name: string;
      slug: string;
      founded: string;
      monogram: string;
    }
  | {
      kind: "suspended";
      host: string;
      rootHost: string;
      name: string;
      slug: string;
      monogram: string;
    }
  | { kind: "unknown"; host: string; rootHost: string };
