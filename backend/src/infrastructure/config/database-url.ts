export type DatabaseSsl = "require" | "disable";

export type DatabaseSettings = {
  url: string;
  ssl: DatabaseSsl;
  prepare: boolean;
};

function parseDatabaseUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("Invalid DATABASE_URL");
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must use postgres:// or postgresql://");
  }

  return parsed;
}

function readSslMode(env: NodeJS.ProcessEnv, parsed: URL): string | null {
  const override = env["DATABASE_SSL"];
  if (override !== undefined && override.length > 0) {
    return override;
  }

  return parsed.searchParams.get("sslmode");
}

function usesTransactionPooler(parsed: URL): boolean {
  if (parsed.searchParams.get("pgbouncer") === "true") {
    return true;
  }

  if (parsed.port === "6543") {
    return true;
  }

  return parsed.hostname.includes("pooler.supabase.com");
}

function readPrepare(env: NodeJS.ProcessEnv, parsed: URL): boolean {
  const raw = env["DATABASE_PREPARE"];
  if (raw === "false" || raw === "0") {
    return false;
  }
  if (raw === "true" || raw === "1") {
    return true;
  }

  return !usesTransactionPooler(parsed);
}

export function loadDatabaseSettings(
  env: NodeJS.ProcessEnv = process.env,
): DatabaseSettings {
  const raw = env["DATABASE_URL"];
  if (raw === undefined || raw.length === 0) {
    throw new Error("DATABASE_URL is required");
  }

  const parsed = parseDatabaseUrl(raw);
  const sslMode = readSslMode(env, parsed);

  let ssl: DatabaseSsl = "disable";
  if (sslMode === "disable" || sslMode === "false") {
    ssl = "disable";
  } else if (
    sslMode === "require" ||
    sslMode === "true" ||
    sslMode === "verify-ca" ||
    sslMode === "verify-full"
  ) {
    ssl = "require";
  }

  return {
    url: raw,
    ssl,
    prepare: readPrepare(env, parsed),
  };
}
