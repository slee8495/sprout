import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { getFamilySettings, getUserLocale } from "@/db/queries";
import { DEFAULT_TIMEZONE } from "@/lib/date";
import { AdClickTracker } from "./AdClickTracker";
import { MobileAuthListener } from "./MobileAuthListener";
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
    document.documentElement.lang = localStorage.getItem("locale") || "en";
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
  title: "Roun",
  description: "A private family journal",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Roun",
  },
};

export const viewport: Viewport = {
  themeColor: "#2fb883",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const [family, initialLocale] = await Promise.all([
    session?.user?.familyId ? getFamilySettings(session.user.familyId) : { timezone: DEFAULT_TIMEZONE },
    session?.user?.id ? getUserLocale(Number(session.user.id)) : undefined,
  ]);

  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SettingsProvider
          family={{ timezone: family.timezone }}
          userId={session?.user?.id ? Number(session.user.id) : 0}
          role={session?.user?.role ?? "editor"}
          initialLocale={initialLocale}
        >
          <AdClickTracker />
          <MobileAuthListener />
          <NavBar />
          {session?.user?.familyId && <PushNotifications />}
          <div className="app-scroll flex flex-1 flex-col" style={{ paddingTop: "var(--navbar-height, 0px)" }}>
            {children}
          </div>
        </SettingsProvider>
      </body>
    </html>
  );
}
