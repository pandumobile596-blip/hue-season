import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // AI model + runtime files are large and rarely change: let phones cache them for 30 days
  // so the second visit starts instantly.
  async headers() {
    const longCache = [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }];
    return [
      { source: "/models/:path*", headers: longCache },
      { source: "/mediapipe/:path*", headers: longCache },
    ];
  },
  partialPrefetching: true,
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
