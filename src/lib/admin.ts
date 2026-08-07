const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdmin(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
