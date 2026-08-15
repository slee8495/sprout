import { Playfair_Display } from "next/font/google";

// Scoped to the Album Library's page/PDF layouts only (via this variable's className on that
// route's wrapper) — the app's everyday UI keeps Fredoka/Nunito from layout.tsx untouched. A
// serif display face reads "keepsake" the way the rounded UI faces don't.
export const albumSerif = Playfair_Display({
  variable: "--font-album-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
