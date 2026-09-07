import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["e-school.et", "*.e-school.et"],
  serverExternalPackages: ["pino", "thread-stream", "pino-std-serializers"],
};

export default nextConfig;
