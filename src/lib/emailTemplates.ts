import { fill, translate, type Locale } from "./i18n";

const WRAPPER_STYLE =
  "font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; color: #27272a;";
const BUTTON_STYLE =
  "display: inline-block; background: #059669; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 999px; font-weight: 600; margin-top: 12px;";

// Absolute URL — email clients can't resolve a relative "/icon-192.png" the way a browser can.
const LOGO_HEADER = `
  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
    <img src="https://roun.sl-studio.dev/icon-192.png" alt="Roun" width="32" height="32" style="border-radius: 8px; display: block;" />
    <span style="font-size: 20px; font-weight: 700; color: #047857;">Roun</span>
  </div>
`;

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function welcomeEmail(input: { familyName: string; appUrl: string; locale?: Locale }): {
  subject: string;
  html: string;
} {
  const locale = input.locale ?? "en";
  const t = (text: string) => translate(locale, text);
  return {
    subject: t("🌱 Welcome to Roun"),
    html: `
      <div style="${WRAPPER_STYLE}">
        ${LOGO_HEADER}
        <p><strong>${fill(t("Welcome, {familyName}!"), { familyName: input.familyName })}</strong> ${t("You're all set to start journaling your family's moments.")}</p>
        <a href="${input.appUrl}" style="${BUTTON_STYLE}">${t("Start journaling")}</a>
        <p style="margin-top: 24px; font-size: 13px; color: #a1a1aa;">
          ${t("You can invite a partner or switch languages anytime from Settings.")}
        </p>
      </div>
    `,
  };
}

export function monthlyAlbumEmail(input: {
  childName: string;
  monthLabel: string;
  appUrl: string;
  locale?: Locale;
}): { subject: string; html: string } {
  const locale = input.locale ?? "en";
  const t = (text: string) => translate(locale, text);
  const values = { childName: input.childName, monthLabel: input.monthLabel };
  return {
    subject: fill(t("📖 {childName}'s {monthLabel} album is ready"), values),
    html: `
      <div style="${WRAPPER_STYLE}">
        ${LOGO_HEADER}
        <p><strong>${fill(t("{childName}'s {monthLabel} album"), values)}</strong> ${t("is attached as a PDF — every photo you kept last month, laid out and ready to save or print.")}</p>
        <a href="${input.appUrl}/library" style="${BUTTON_STYLE}">${t("Open the album")}</a>
        <p style="margin-top: 24px; font-size: 13px; color: #a1a1aa;">
          ${t("You'll get one of these on the 1st of every month for each child/pet with photos from the month before.")}
        </p>
      </div>
    `,
  };
}

// General-purpose announcement email (product news, "now on the App Store", etc). `body` is
// plain text — one `<p>` per non-empty line, so callers can write multi-paragraph copy without
// hand-writing HTML. Unlike the templates above, this one has no `locale` param: the copy is
// free text an admin types per send, not a fixed string in the translation dictionary, so there's
// nothing to look up — it goes out in whatever language it was written in.
export function announcementEmail(input: {
  subject: string;
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}): { subject: string; html: string } {
  const paragraphs = input.body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("\n");

  return {
    subject: input.subject,
    html: `
      <div style="${WRAPPER_STYLE}">
        ${LOGO_HEADER}
        <h2 style="color: #27272a; margin-bottom: 4px;">${escapeHtml(input.heading)}</h2>
        ${paragraphs}
        ${input.ctaLabel && input.ctaHref ? `<a href="${input.ctaHref}" style="${BUTTON_STYLE}">${input.ctaLabel}</a>` : ""}
      </div>
    `,
  };
}

export function subscriptionCanceledEmail(input: { appUrl: string; locale?: Locale }): {
  subject: string;
  html: string;
} {
  const locale = input.locale ?? "en";
  const t = (text: string) => translate(locale, text);
  return {
    subject: t("Your Pro subscription has ended"),
    html: `
      <div style="${WRAPPER_STYLE}">
        ${LOGO_HEADER}
        <p>${t("Your Pro subscription has ended and your account is now on the Free plan.")}</p>
        <p style="font-weight: 600;">${t("Everything you've already written or uploaded stays exactly as it is — nothing is deleted.")}</p>
        <p>${t("On the Free plan:")}</p>
        <ul>
          <li>${t("You can't add a new child/pet beyond your first one (existing ones are unaffected)")}</li>
          <li>${t("You can't upload new photos/videos once you're over 1GB (existing files are unaffected)")}</li>
        </ul>
        <a href="${input.appUrl}/settings" style="${BUTTON_STYLE}">${t("Resubscribe")}</a>
      </div>
    `,
  };
}
