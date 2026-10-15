"use client";

import { postJSON } from "./api";
import { nextFocusAfter } from "./progress";
import { getState, update } from "./store";
import type { Feedback, RevisionResult } from "./types";

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
        discipline: s.discipline,
        frame: s.frame,
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

const revisionInFlight = new Map<string, Promise<void>>();

/** Compare a revised paragraph with the original (once) and store the result. */
export function requestRevision(sessionId: string): Promise<void> {
  const existing = revisionInFlight.get(sessionId);
  if (existing) return existing;
  const p = (async () => {
    const st = getState();
    const s = st.sessions.find((x) => x.id === sessionId);
    const orig = s?.revisionOf ? st.sessions.find((x) => x.id === s.revisionOf) : undefined;
    if (!s || s.revision || !orig) return;
    try {
      const out = await postJSON<RevisionResult>("/api/revise", {
        discipline: s.discipline,
        task: s.task,
        frame: s.frame,
        promptText: s.promptText,
        original: orig.text,
        revised: s.text,
        earlierFeedback: orig.feedback ? [orig.feedback.summary, orig.feedback.workOn ? `To work on: ${orig.feedback.workOn.label}. ${orig.feedback.workOn.comment}` : ""].join(" ") : "",
      });
      update((st2) => ({ ...st2, sessions: st2.sessions.map((x) => (x.id === sessionId ? { ...x, revision: out, revisionError: undefined } : x)) }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Couldn't compare your versions.";
      update((st2) => ({ ...st2, sessions: st2.sessions.map((x) => (x.id === sessionId ? { ...x, revisionError: msg } : x)) }));
    } finally {
      revisionInFlight.delete(sessionId);
    }
  })();
  revisionInFlight.set(sessionId, p);
  return p;
}

export function clearRevisionError(sessionId: string) {
  update((st) => ({ ...st, sessions: st.sessions.map((x) => (x.id === sessionId ? { ...x, revisionError: undefined } : x)) }));
}
