import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPlatformAdminHost, parseSchoolHost } from "@/lib/host";

function withSchoolHeaders(request: NextRequest, hostname: string, subdomain: string | null) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-school-host", hostname);
  if (subdomain !== null) {
    requestHeaders.set("x-school-subdomain", subdomain);
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("x-school-host", hostname);
  if (subdomain !== null) {
    response.headers.set("x-school-subdomain", subdomain);
  }
  return response;
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const parsed = parseSchoolHost(host);
  const pathname = request.nextUrl.pathname;
  const adminHost = isPlatformAdminHost(host);

  if (!adminHost && pathname.startsWith("/platform-admin")) {
    return new NextResponse(null, { status: 404 });
  }

  return withSchoolHeaders(request, parsed.hostname, parsed.subdomain);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
