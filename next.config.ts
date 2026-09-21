import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" as const } : {}),
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
