"use client";

import { postJSON } from "./api";
import { nextFocusAfter } from "./progress";
import { getState, update } from "./store";
import type { Feedback } from "./types";

const inFlight = new Map<string, Promise<void>>();

/** Fetch feedback for a saved paragraph (once), store it, credit reused bank patterns, and move the focus on if earned. */
export function requestFeedback(sessionId: string): Promise<void> {
  const existing = inFlight.get(sessionId);
  if (existing) return existing;
  const p = (async () => {
    const st0 = getState();
    const s = st0.sessions.find((x) => x.id === sessionId);
    if (!s || s.feedback) return;
    const recentBank = st0.bank.filter((b) => b.sessionId !== sessionId).slice(-5);
    try {
      const fb = await postJSON<Feedback>("/api/feedback", {
        task: s.task,
        promptText: s.promptText,
        source: s.source,
        focusId: s.focusId,
        mode: s.mode,
        plan: s.plan,
        text: s.text,
        words: s.words,
        writeSeconds: s.writeSeconds,
        huntItems: s.huntItems,
        bank: recentBank.map((b) => ({ label: b.label, example: b.after })),
      });
      update((st) => {
        const sessions = st.sessions.map((x) => (x.id === sessionId ? { ...x, feedback: fb, feedbackError: undefined } : x));
        const profile = st.profile ? { ...st.profile, focus: nextFocusAfter(st.profile, sessions) } : st.profile;
        const reusedLabels = new Set(fb.transfer.map((t) => t.label));
        const bank = st.bank.map((b) => (reusedLabels.has(b.label) && b.sessionId !== sessionId ? { ...b, reused: b.reused + 1 } : b));
        return { ...st, sessions, profile, bank };
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Feedback failed.";
      update((st) => ({ ...st, sessions: st.sessions.map((x) => (x.id === sessionId ? { ...x, feedbackError: msg } : x)) }));
    } finally {
      inFlight.delete(sessionId);
    }
  })();
  inFlight.set(sessionId, p);
  return p;
}

export function clearFeedbackError(sessionId: string) {
  update((st) => ({ ...st, sessions: st.sessions.map((x) => (x.id === sessionId ? { ...x, feedbackError: undefined } : x)) }));
}
