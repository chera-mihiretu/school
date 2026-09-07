export type Health = {
  ok: boolean;
  service: string;
  database: "up" | "down";
};
