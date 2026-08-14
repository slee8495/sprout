import { Resend } from "resend";

let resendClient: Resend | undefined;

function getResend(): Resend {
  return (resendClient ??= new Resend(process.env.RESEND_API_KEY));
}

export async function sendEmail(input: { to: string | string[]; subject: string; html: string }) {
  const domain = process.env.RESEND_EMAIL_DOMAIN;
  if (!domain) return; // Not configured (e.g. local dev without Resend env vars) — skip silently.

  await getResend().emails.send({
    from: `Roun <no-reply@${domain}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
}
