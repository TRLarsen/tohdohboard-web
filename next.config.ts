import type { NextConfig } from "next";

// TOHDOH_STATIC_EXPORT=1 builds a static site (`out/`) with no Next server, so there is
// nothing to proxy /api: the browser must call the backend directly.
const staticExport = process.env.TOHDOH_STATIC_EXPORT === "1";
if (staticExport && !process.env.NEXT_PUBLIC_TOHDOH_API_URL) {
  throw new Error("TOHDOH_STATIC_EXPORT=1 requires NEXT_PUBLIC_TOHDOH_API_URL (e.g. https://board.example.com/api)");
}

// Where the Next server proxies same-origin /api requests. Read when the config is loaded,
// i.e. by `next build` (baked into the build output) and `next dev`.
const backendUrl = (process.env.TOHDOH_BACKEND_URL ?? "http://127.0.0.1:3001").replace(/\/+$/, "");

const nextConfig: NextConfig = staticExport
  ? { output: "export" }
  : {
      async rewrites() {
        return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
      },
    };

export default nextConfig;
