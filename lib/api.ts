"use client";

import { getState } from "./store";

function headers(json = true): HeadersInit {
  const code = getState().profile?.accessCode ?? "";
  return { ...(json ? { "Content-Type": "application/json" } : {}), ...(code ? { "x-access-code": code } : {}) };
}

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Something went wrong (${res.status}).`);
  return data as T;
}

export function postJSON<T>(url: string, body: unknown): Promise<T> {
  return fetch(url, { method: "POST", headers: headers(), body: JSON.stringify(body) }).then((r) => handle<T>(r));
}

export function postForm<T>(url: string, form: FormData): Promise<T> {
  return fetch(url, { method: "POST", headers: headers(false), body: form }).then((r) => handle<T>(r));
}

export function getConfig(): Promise<{ ready: boolean; accessCodeRequired: boolean }> {
  return fetch("/api/config").then((r) => handle(r));
}
