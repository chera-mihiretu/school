export type DatabasePort = {
  ping: () => Promise<void>;
  close: () => Promise<void>;
};
