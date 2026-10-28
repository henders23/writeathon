"use client";

import { useSyncExternalStore } from "react";

let message: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

export function toast(text: string, ms = 3200) {
  message = text;
  listeners.forEach((l) => l());
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    message = null;
    listeners.forEach((l) => l());
  }, ms);
}

export function useToast(): string | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => message,
    () => null,
  );
}
