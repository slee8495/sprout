import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // ffmpeg-static/ffprobe-static resolve their binary path via __dirname at require-time.
  // Left to Next's default bundling, that module gets rewritten/inlined and __dirname no
  // longer points at the real node_modules location, producing ENOENT at runtime even
  // though outputFileTracingIncludes (below) correctly copies the binary into the deploy.
  // Marking them external keeps their own path resolution intact.
  serverExternalPackages: ["ffmpeg-static", "ffprobe-static"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        port: "",
        search: "",
      },
    ],
  },
  // ffmpeg-static/ffprobe-static ship prebuilt binaries that are only referenced by a
  // runtime path string (not `require`-d), so Next's file tracer doesn't auto-include
  // them in the serverless function bundle — without this, ffmpeg/ffprobe are missing
  // in production even though the build succeeds and everything works locally.
  outputFileTracingIncludes: {
    "/api/video/transcode": ["./node_modules/ffmpeg-static/**/*", "./node_modules/ffprobe-static/**/*"],
  },
  // Auth.js's signin/callback redirects were getting Next's default "public, max-age=0,
  // must-revalidate" Cache-Control, which permits shared/compressing proxies (e.g. Chrome's
  // mobile Data Saver) to cache and replay the response — including the one-time PKCE cookie —
  // across requests. That caused "InvalidCheck: pkceCodeVerifier value could not be parsed" for
  // first-time Google sign-ins on regular mobile Chrome (Incognito disables Data Saver, which is
  // why it worked there). Forcing no-store/private here stops any proxy from caching auth traffic.
  async headers() {
    return [
      {
        source: "/api/auth/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, private" }],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "sl-studio-le",
  project: "sprout",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
});
