"use client";

import { useSyncExternalStore } from "react";

// The welcome screen is shown once each time someone opens the app (once per browser tab session).
const KEY = "writeathon.welcomed";
const listeners = new Set<() => void>();
let dismissedInMemory = false;

function seen(): boolean {
  if (dismissedInMemory) return true;
  try {
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return false; // storage blocked: fall back to once per page load
  }
}

export function dismissWelcome() {
  dismissedInMemory = true;
  try {
    window.sessionStorage.setItem(KEY, "1");
  } catch {
    /* storage blocked */
  }
  listeners.forEach((l) => l());
}

/** True once the welcome screen has been dismissed in this visit; null while the page is still loading. */
export function useWelcomed(): boolean | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    seen,
    () => null,
  );
}
