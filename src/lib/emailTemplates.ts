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

// Appended to every outgoing email, transactional or not — a low-key cross-sell for the
// SL Studio newsletter, not specific to Roun. Links straight to the signup form on the
// marketing site rather than a dedicated landing page.
const NEWSLETTER_FOOTER = `
  <p style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e4e4e7; font-size: 13px; color: #a1a1aa;">
    Want to hear about other things SL Studio builds? <a href="https://sl-studio.dev/#newsletter" style="color:#059669;">Subscribe to the newsletter</a>.
  </p>
`;

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// A personal note from the founder rather than a boilerplate confirmation — deliberately warmer
// and longer than a typical transactional email. English-only by choice: it fires immediately at
// signup, before the user has ever had a chance to set a language in Settings, and this copy is
// hand-tuned voice rather than a fixed dictionary string, so there's no good translation to fall
// back to yet.
export function welcomeEmail(input: { familyName: string; appUrl: string }): {
  subject: string;
  html: string;
} {
  return {
    subject: "🌱 Welcome to Roun",
    html: `
      <div style="${WRAPPER_STYLE}">
        ${LOGO_HEADER}
        <p>Hi ${input.familyName}, so glad you're here!</p>
        <p>I hope this app helps you fill up with happy memories of your kids and pets.</p>
        <p>I built this because I'm a parent too. I wanted a richer way to hold onto the moments with my own child, something we could look back on and share together one day, and I wanted to share that with everyone who needed the same thing, not just keep it for myself.</p>
        <p>The Free plan can already do a lot, but Pro lets you hold onto a lot more of what matters.</p>
        <p>Pro's $3.99 price isn't there for my profit. It's set at close to the minimum it actually costs to run and maintain this app.</p>
        <p>As a parent raising my own kid, and as someone who still misses a dog I loved and lost, I hope your memories with your family, your pets, everyone, stay here exactly as vivid as the day you wrote them down, forever.</p>
        <p>SL Studio is always listening. Reach out anytime at <a href="mailto:support@sl-studio.dev" style="color:#059669;">support@sl-studio.dev</a> or through <a href="https://sl-studio.dev" style="color:#059669;">sl-studio.dev</a>.</p>
        <p>Let's start this journey with the family you love. 🌱</p>
        <a href="${input.appUrl}" style="${BUTTON_STYLE}">Start journaling</a>
        ${NEWSLETTER_FOOTER}
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
        ${NEWSLETTER_FOOTER}
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
        ${NEWSLETTER_FOOTER}
      </div>
    `,
  };
}

// Same founder-voice choice as welcomeEmail above: English-only, hand-tuned copy rather than a
// dictionary lookup.
export function subscriptionCanceledEmail(input: { appUrl: string }): {
  subject: string;
  html: string;
} {
  return {
    subject: "Sorry to see you go",
    html: `
      <div style="${WRAPPER_STYLE}">
        ${LOGO_HEADER}
        <p>It's genuinely sad that this space for your family and pets' memories won't be with you all the way through. Sorry to see you go.</p>
        <p style="font-weight: 600;">But I respect your choice. And I want you to remember: the best moments and memories with your family are already yours, forever. They never fade.</p>
        <p>Everything you've already written or uploaded stays exactly as it is. Nothing is deleted.</p>
        <p>On the Free plan:</p>
        <ul>
          <li>You can't add a new child/pet beyond your first one (existing ones are unaffected)</li>
          <li>You can't upload new photos/videos once you're over 1GB (existing files are unaffected)</li>
        </ul>
        <p>I hope we get to see you again sometime. If anything comes up or you have any questions, reach out anytime. I'll always be here waiting.</p>
        <a href="${input.appUrl}/settings" style="${BUTTON_STYLE}">Resubscribe</a>
        ${NEWSLETTER_FOOTER}
      </div>
    `,
  };
}
