"use client";

import Link from "next/link";
import { useState } from "react";
import { Bookmark, Check, Close } from "@/components/Icons";
import Loading from "@/components/Loading";
import Onboarding from "@/components/Onboarding";
import { postJSON } from "@/lib/api";
import { ROWS } from "@/lib/content";
import { dayKey } from "@/lib/dates";
import { dueBankItems, nextReviewLabel, scheduleAfterReview } from "@/lib/progress";
import { updateBankItem, useAppState } from "@/lib/store";
import type { BankItem } from "@/lib/types";

type Verdict = { ok: boolean; comment: string };

/**
 * Bank review: spaced retrieval. The student sees the sentence as it was BEFORE they fixed it,
 * fixes it again from memory, and only then sees their banked version.
 */
export default function ReviewPage() {
  const state = useAppState();
  const today = dayKey();
  // Freeze today's queue when the page opens, so items don't vanish mid-review.
  const [queue, setQueue] = useState<BankItem[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [attempt, setAttempt] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<Verdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  if (!state) return <Loading />;
  if (!state.profile) return <Onboarding />;
  const items = queue ?? dueBankItems(state.bank, today);
  if (!queue && items.length) setQueue(items);

  const header = (
    <div className="row between">
      <div className="row gap-8">
        <Bookmark color="var(--blue)" />
        <span className="eyebrow blue">Bank review</span>
      </div>
      <Link href="/" className="icon-btn" aria-label="Close">
        <Close />
      </Link>
    </div>
  );

  if (items.length === 0) {
    return (
      <main className="shell">
        <div className="page">
          {header}
          <h1 className="h1">Nothing due today.</h1>
          <p className="body">Banked sentences come back after 1, 3, 7, 14 and 30 days. Each time you fix one from memory, the gap grows.</p>
          <Link href="/" className="btn" style={{ marginTop: "auto" }}>Back to Today</Link>
        </div>
      </main>
    );
  }

  if (idx >= items.length) {
    return (
      <main className="shell">
        <div className="page">
          {header}
          <h1 className="h1">{score === items.length ? "All fixed from memory." : `${score} of ${items.length} fixed from memory.`}</h1>
          <p className="body">
            Remembering a fix after a gap is what makes it stick. {score < items.length ? "The ones you missed come back tomorrow." : "The gaps get longer now."}
          </p>
          <div className="stack gap-10" style={{ marginTop: "auto" }}>
            <Link href="/bank" className="btn secondary">See your bank</Link>
            <Link href="/" className="btn">Back to Today</Link>
          </div>
        </div>
      </main>
    );
  }

  const item = items[idx];
  const text = attempt ?? item.before;
  const live = state.bank.find((b) => b.id === item.id) ?? item;

  async function check() {
    setError(null);
    setChecking(true);
    try {
      const v = await postJSON<Verdict>("/api/rewrite", {
        mode: "review",
        label: item.label,
        clue: `Fix this the way you fixed it before (${item.label.toLowerCase()}).`,
        original: item.before,
        model: item.after,
        attempt: text,
        hintLevel: 0,
      });
      setResult(v);
      if (v.ok) setScore((s) => s + 1);
      updateBankItem(scheduleAfterReview(live, v.ok, today));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't check that.");
    }
    setChecking(false);
  }

  function next() {
    setIdx((i) => i + 1);
    setAttempt(null);
    setResult(null);
  }

  return (
    <main className="shell">
      <div className="page" style={{ gap: 18 }}>
        {header}
        <p className="small">Sentence {idx + 1} of {items.length}</p>
        <div className="stack gap-4">
          <span className="eyebrow amber">{ROWS[item.row]?.label} · {item.label}</span>
          <h1 className="h1" style={{ fontSize: 24 }}>Fix it again, from memory.</h1>
          <p className="body">This is how the sentence looked before you fixed it. Don&apos;t look anything up.</p>
        </div>
        <div className="field">
          <label htmlFor="recall">Your fix</label>
          <textarea
            id="recall"
            rows={4}
            value={text}
            autoFocus
            disabled={Boolean(result)}
            onChange={(e) => setAttempt(e.target.value)}
            onPaste={(e) => e.preventDefault()}
            style={{ fontFamily: "var(--serif)", fontSize: 18, lineHeight: 1.4 }}
          />
        </div>
        {error && <div className="error" role="alert">{error}</div>}
        {!result ? (
          <button className="btn" onClick={check} disabled={checking || text.trim() === item.before.trim()}>
            {checking ? "Checking…" : text.trim() === item.before.trim() ? "Change the sentence, then check" : "Check"}
          </button>
        ) : (
          <>
            <p className="body" aria-live="polite" style={{ color: result.ok ? "var(--blue)" : "var(--ink-2)", fontWeight: 500 }}>
              {result.ok && <Check size={14} color="var(--blue)" />} {result.comment}
            </p>
            <div className="card tight bank-item">
              <span className="eyebrow">Your banked version</span>
              <p className="bank-after">{item.after}</p>
              {item.transfer && <p className="small"><strong>Your own example:</strong> {item.transfer}</p>}
            </div>
            <p className="small">{nextReviewLabel(state.bank.find((b) => b.id === item.id) ?? item, today)}.</p>
            <button className="btn" onClick={next}>{idx + 1 < items.length ? "Next sentence" : "Finish"}</button>
          </>
        )}
      </div>
    </main>
  );
}
