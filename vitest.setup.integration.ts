import { readFileSync } from "node:fs";
import path from "node:path";

// Minimal .env.local loader — avoids adding a dotenv dependency just for tests.
// Mirrors what Next.js does automatically for the app itself.
const envPath = path.resolve(__dirname, ".env.local");
try {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
} catch {
  // .env.local not present — assume env vars are already set (e.g. in CI).
}
