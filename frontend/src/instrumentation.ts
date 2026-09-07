import type { Instrumentation } from "next";

// Dynamic import is required by Next.js so Pino (Node-only) never loads on Edge.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerNodeInstrumentation } = await import("./instrumentation-node");
    registerNodeInstrumentation();
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { logRequestError } = await import("./instrumentation-node");
  logRequestError(error, request, context);
};
