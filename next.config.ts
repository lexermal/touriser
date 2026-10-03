import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Lets a phone on the home Wi-Fi load the dev server (`next dev` blocks other origins by default).
  // Dev-only setting; has no effect on production builds.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  // node:sqlite is a Node builtin; keep it out of the bundler.
  serverExternalPackages: ["node:sqlite"],
  async headers() {
    return [
      { source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      // The service worker must never be served stale, or app updates never arrive.
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    ];
  },
};

export default nextConfig;
