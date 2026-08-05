import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
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
    "/api/video/upload": ["./node_modules/ffmpeg-static/**/*", "./node_modules/ffprobe-static/**/*"],
  },
};

export default withSentryConfig(nextConfig, {
  org: "sl-studio-le",
  project: "sprout",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
});
