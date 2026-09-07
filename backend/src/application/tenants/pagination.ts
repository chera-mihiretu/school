export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MIN_PAGE = 1;
export const MIN_PAGE_SIZE = 1;
export const MAX_PAGE_SIZE = 50;

function readInteger(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

export function normalizePage(value: unknown): number {
  const parsed = readInteger(value);
  if (parsed === undefined) {
    return DEFAULT_PAGE;
  }

  return Math.max(MIN_PAGE, parsed);
}

export function normalizePageSize(value: unknown): number {
  const parsed = readInteger(value);
  if (parsed === undefined) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, parsed));
}
