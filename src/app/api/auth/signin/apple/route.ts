import type { NextRequest } from "next/server";
import { handlers } from "@/auth";

// Auth.js marks Apple's `state` and `nonce` cookies `SameSite=None` because Apple answers with
// `response_mode=form_post`, i.e. a cross-site POST back to the callback. Safari on iOS never
// stored them: every attempt died at the callback with "state cookie was missing" — and it stayed
// missing even on the same-site retry from ../callback/apple, which proves the cookies were never
// written rather than merely withheld. Chrome, through this identical route, stores and returns
// them fine.
//
// So stop depending on `SameSite=None`. Downgrade those cookies to `Lax`, which every browser
// stores, and let ../callback/apple's same-site bounce carry them into the callback — `Lax`
// cookies are sent on same-site requests whatever the method. Nothing else needs these cookies,
// and Google's flow never had them set to `None` in the first place.
//
// This static segment shadows the [...nextauth] catch-all for this one path only.

export const GET = handlers.GET;

export async function POST(request: NextRequest) {
  const response = await handlers.POST(request);

  const setCookies = response.headers.getSetCookie();
  if (!setCookies.some((cookie) => /SameSite=None/i.test(cookie))) return response;

  const headers = new Headers(response.headers);
  headers.delete("set-cookie");
  for (const cookie of setCookies) {
    headers.append("set-cookie", cookie.replace(/SameSite=None/gi, "SameSite=Lax"));
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
