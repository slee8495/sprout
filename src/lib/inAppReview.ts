"use client";

import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { InAppReview } from "@capacitor-community/in-app-review";

const ENTRY_COUNT_KEY = "reviewPromptEntryCount";
const REQUESTED_KEY = "reviewPromptRequested";
const ENTRIES_BEFORE_PROMPT = 3;

// Asks the OS to show its native "Enjoying the app?" review prompt (App Store / Play Store) once
// the user has published a few real entries — a moment they're likely happy, not right after
// install. Both platforms silently throttle the actual dialog on their own (Apple caps it at a
// few times a year; Android has its own quota), so this only ever needs to ask once — no harm if
// the OS decides not to show anything.
export async function maybeRequestReview() {
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable("InAppReview")) return;

  const { value: requested } = await Preferences.get({ key: REQUESTED_KEY });
  if (requested) return;

  const { value: countRaw } = await Preferences.get({ key: ENTRY_COUNT_KEY });
  const count = (Number(countRaw) || 0) + 1;

  if (count < ENTRIES_BEFORE_PROMPT) {
    await Preferences.set({ key: ENTRY_COUNT_KEY, value: String(count) });
    return;
  }

  await Preferences.set({ key: REQUESTED_KEY, value: "1" });
  try {
    await InAppReview.requestReview();
  } catch {
    // isPluginAvailable() can report true on a native shell where the plugin still fails to
    // resolve (see the "Browser" plugin incident) — never let that break the save flow.
  }
}
