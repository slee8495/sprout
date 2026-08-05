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
};

export default withSentryConfig(nextConfig, {
  org: "sl-studio-le",
  project: "sprout",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
});
