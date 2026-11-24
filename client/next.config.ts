import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let phones on the local network load dev assets (JS chunks, HMR) when the
  // app is opened via the machine's LAN IP, e.g. http://192.168.0.191:3000.
  // Without this, client components such as the Recharts charts never hydrate.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  // Off because we deploy to Cloudflare Workers (OpenNext): with Cache
  // Components on, pages hang on the Workers runtime and return 500.
  // Re-enable once OpenNext supports it (opennextjs-cloudflare PR #1318).
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
