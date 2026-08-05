const attempts = new Map<string, number[]>();

// In-memory sliding-window limiter — fine for this app's traffic and instance-reuse
// characteristics (Fluid Compute). Not a global/distributed limit, but meaningfully
// slows down a single actor hammering the same warm instance, which is the realistic threat.
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  attempts.set(key, recent);
  return recent.length > limit;
}
