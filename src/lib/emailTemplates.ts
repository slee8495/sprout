const WRAPPER_STYLE =
  "font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; color: #27272a;";
const BUTTON_STYLE =
  "display: inline-block; background: #059669; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 999px; font-weight: 600; margin-top: 12px;";

export function welcomeEmail(input: { familyName: string; appUrl: string }): { subject: string; html: string } {
  return {
    subject: "🌱 Welcome to Sprout",
    html: `
      <div style="${WRAPPER_STYLE}">
        <h1 style="color: #047857;">🌱 Sprout</h1>
        <p><strong>Welcome, ${input.familyName}!</strong> You're all set to start journaling your family's moments.</p>
        <a href="${input.appUrl}" style="${BUTTON_STYLE}">Start journaling</a>
        <p style="margin-top: 24px; font-size: 13px; color: #a1a1aa;">
          You can invite a partner or switch languages anytime from Settings.
        </p>
      </div>
    `,
  };
}

export function subscriptionCanceledEmail(input: { appUrl: string }): { subject: string; html: string } {
  return {
    subject: "Your Pro subscription has ended",
    html: `
      <div style="${WRAPPER_STYLE}">
        <h1 style="color: #047857;">🌱 Sprout</h1>
        <p>Your Pro subscription has ended and your account is now on the Free plan.</p>
        <p style="font-weight: 600;">Everything you've already written or uploaded stays exactly as it is — nothing is deleted.</p>
        <p>On the Free plan:</p>
        <ul>
          <li>You can't add a new child/pet beyond your first one (existing ones are unaffected)</li>
          <li>You can't upload new photos/videos once you're over 1GB (existing files are unaffected)</li>
        </ul>
        <a href="${input.appUrl}/settings" style="${BUTTON_STYLE}">Resubscribe</a>
      </div>
    `,
  };
}
