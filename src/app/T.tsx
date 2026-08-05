"use client";

import { useSettings } from "./SettingsProvider";

// Translates a literal string inside an otherwise-server component, without converting
// the whole page to a client component. Client components should just call useSettings().t()
// directly instead of reaching for this.
export function T({ children }: { children: string }) {
  return <>{useSettings().t(children)}</>;
}
