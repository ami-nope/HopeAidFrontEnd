import os from "node:os";
import type { NextConfig } from "next";

function getAllowedDevOrigins(): string[] {
  const origins = new Set<string>();

  for (const addresses of Object.values(os.networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.internal || address.family !== "IPv4") {
        continue;
      }

      origins.add(address.address);
    }
  }

  return Array.from(origins);
}

const nextConfig: NextConfig = {
  allowedDevOrigins: getAllowedDevOrigins(),
  async rewrites() {
    return [
      { source: "/devadmin", destination: "/admin" },
      { source: "/devadmin/:path*", destination: "/admin/:path*" },
      { source: "/org-admin", destination: "/admin" },
      { source: "/org-admin/:path*", destination: "/admin/:path*" },
      { source: "/org-manager", destination: "/admin" },
      { source: "/org-manager/:path*", destination: "/admin/:path*" },
    ];
  },
  devIndicators: false,
  logging: {
    incomingRequests: false,
    serverFunctions: false,
    browserToTerminal: false,
  },
  reactStrictMode: false,
};

export default nextConfig;
