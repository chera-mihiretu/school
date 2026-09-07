import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export function GET() {
  logger.debug({ event: "health.check" }, "frontend health check");
  return NextResponse.json({ ok: true, service: "frontend-service" });
}
