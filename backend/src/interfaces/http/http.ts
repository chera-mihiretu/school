import type { IncomingHttpHeaders, ServerResponse } from "node:http";

type RequestUrl = {
  headers: IncomingHttpHeaders;
  url?: string | undefined;
};

export function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
): void {
  const payload = JSON.stringify(body);

  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

export function getRequestUrl(req: RequestUrl): URL {
  const host = req.headers.host ?? "localhost";
  return new URL(req.url ?? "/", `http://${host}`);
}

export function getPathname(req: RequestUrl): string {
  return getRequestUrl(req).pathname;
}
