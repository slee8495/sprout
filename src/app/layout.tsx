import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { getFamilySettings } from "@/db/queries";
import { DEFAULT_TIMEZONE } from "@/lib/date";
import { NavBar } from "./NavBar";
import { PushNotifications } from "./PushNotifications";
import { SettingsProvider } from "./SettingsProvider";

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var theme = localStorage.getItem("theme") || "system";
    var isDark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.dataset.fontSize = localStorage.getItem("fontSize") || "md";
  } catch (e) {}
})();
`;

const fredoka = Fredoka({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sprout",
  description: "Roun's family journal",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sprout",
  },
};

export const viewport: Viewport = {
  themeColor: "#2fb883",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const family = session?.user?.familyId
    ? await getFamilySettings(session.user.familyId)
    : { timezone: DEFAULT_TIMEZONE, birthDate: null, dayCountStart: "zero" as const };

  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SettingsProvider family={{ timezone: family.timezone, birthDate: family.birthDate ?? "", dayCountStart: family.dayCountStart }}>
          <NavBar />
          {children}
          <PushNotifications />
        </SettingsProvider>
      </body>
    </html>
  );
}
