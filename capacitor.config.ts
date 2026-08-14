import type { CapacitorConfig } from "@capacitor/cli";

// Roun is a fully server-rendered Next.js app (auth, DB, server actions, Stripe webhooks) —
// it can't be statically exported, so instead of bundling a local web build, the native shell
// loads the live production site directly. This is Capacitor's standard "remote URL" pattern
// for wrapping an existing dynamic web app rather than a static one.
const config: CapacitorConfig = {
  appId: "dev.slstudio.sprout",
  appName: "Roun",
  webDir: "public",
  server: {
    url: "https://roun.sl-studio.dev",
    cleartext: false,
  },
  ios: {
    contentInset: "automatic",
  },
};

export default config;
