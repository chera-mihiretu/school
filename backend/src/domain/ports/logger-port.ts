export type LogBindings = Record<string, unknown>;

export type LoggerPort = {
  debug: (bindings: LogBindings, msg: string) => void;
  info: (bindings: LogBindings, msg: string) => void;
  warn: (bindings: LogBindings, msg: string) => void;
  error: (bindings: LogBindings, msg: string) => void;
  fatal: (bindings: LogBindings, msg: string) => void;
  flush: (callback?: (error?: Error) => void) => void;
};
