# Fix: /get-app was bouncing logged-out visitors to /login

## Why this happened

The marketing site (`sl-studio.dev/roun`) got two new links this session — the
Pro "Start free trial" CTA (on mobile) and a new "Mobile Web App" download
card — both pointing at `roun.sl-studio.dev/get-app`, the public install
guide. Testing that flow on a real iPhone surfaced a bug already latent in
this app: `/get-app` would render for a moment, then redirect to `/login`
before anyone could read the install steps.

## Root cause

`src/app/proxy.ts` (middleware) already treats `/get-app` as public — that
part was correct. But `src/app/NavBar.tsx` keeps its own, separate list of
paths where the nav bar should stay hidden, and `/get-app` wasn't on it. So
`NavBar` rendered anyway, which mounts `NotificationBell`, which calls the
`getNotifications()` server action on mount, which calls `requireSession()` —
and `requireSession()` does `redirect("/login")` for anyone without a
session. Next.js's `redirect()` isn't a normal rejected promise, so the
`.catch(() => {})` around that call in `NotificationBell` didn't stop it —
the framework performs the navigation regardless.

## Fix

One file: `src/app/NavBar.tsx`. Added `"/get-app"` to the same hide-list
that already covers `/login`, `/privacy`, `/terms`, `/account-deletion`, etc.
Commit `91c88f5`, pushed to `main`, deployed to production
(`roun.sl-studio.dev`).

## Not touched

This repo had a bunch of unrelated uncommitted work sitting in the working
tree (admin actions/page, email templates, android/ios project files, a new
`AdminAnnouncementForm.tsx`, demo videos, etc.) — none of that was staged,
committed, or pushed. Only `src/app/NavBar.tsx` was touched.

## Possibly worth a second look later

The user also asked, independently, whether re-signing in with an email tied
to a previously **deleted** account (`deleteAccountAction` in
`src/app/settings/deleteAccountActions.ts` fully removes the family row via
`deleteFamilyAccount`) could throw a client-side exception. That's a
separate, unconfirmed hypothesis — worth checking `getUserByEmail` /
`jwt()` callback behavior in `src/auth.ts` for a signed-in-but-no-family-row
edge case if it comes up again, but wasn't the cause of the `/get-app`
redirect above (that reproduced from a plain incognito/logged-out visit,
no deleted account involved).
