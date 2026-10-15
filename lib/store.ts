"use client";

import { useSyncExternalStore } from "react";
import type { AppState, BankItem, Profile, Session } from "./types";

// All student data lives in this browser for now (no accounts yet).
const KEY = "writeathon.v1";
const EMPTY: AppState = { version: 1, profile: null, sessions: [], bank: [], huntCache: null, surgeryCache: null, surgeryRuns: [] };

let cache: AppState | null = null;
const listeners = new Set<() => void>();

function read(): AppState {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...EMPTY, ...(JSON.parse(raw) as AppState) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: AppState) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage can be full or blocked (private mode); keep the in-memory copy.
  }
  listeners.forEach((l) => l());
}

export function getState(): AppState {
  return typeof window === "undefined" ? EMPTY : read();
}

export function update(fn: (s: AppState) => AppState) {
  write(fn(read()));
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

const SERVER_SNAPSHOT: AppState | null = null;

/** Returns null until the browser store has loaded (avoids hydration mismatch). */
export function useAppState(): AppState | null {
  return useSyncExternalStore(subscribe, read, () => SERVER_SNAPSHOT);
}

export function saveProfile(p: Profile) {
  update((s) => ({ ...s, profile: p }));
}

export function upsertSession(session: Session) {
  update((s) => {
    const others = s.sessions.filter((x) => x.id !== session.id);
    return { ...s, sessions: [...others, session].sort((a, b) => a.startedAt.localeCompare(b.startedAt)) };
  });
}

export function patchSession(id: string, patch: Partial<Session> | ((s: Session) => Partial<Session>)) {
  update((s) => ({
    ...s,
    sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...(typeof patch === "function" ? patch(x) : patch) } : x)),
  }));
}

export function addToBank(item: BankItem) {
  update((s) => ({ ...s, bank: [...s.bank.filter((b) => b.sessionId !== item.sessionId), item] }));
}

export function updateBankItem(item: BankItem) {
  update((s) => ({ ...s, bank: s.bank.map((b) => (b.id === item.id ? item : b)) }));
}

export function resetAll() {
  write(EMPTY);
}

export function newId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
