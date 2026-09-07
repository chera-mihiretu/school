export type PublicUrlOptions = {
  label?: "admin" | "app" | string;
  path?: string;
};

export type PublicUrlPort = {
  publicUrl: (options?: PublicUrlOptions) => string;
};
