"use client";

import Link from "next/link";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import { Bookmark, Check } from "@/components/Icons";
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

  const eyebrow = (
    <span className="row g8">
      <Bookmark size={18} color="var(--blue)" />
      <span className="eyebrow blue">Bank review{items.length ? ` · sentence ${Math.min(idx + 1, items.length)} of ${items.length}` : ""}</span>
    </span>
  );

  if (items.length === 0) {
    return (
      <AppShell>
        <main className="container narrow">
          {eyebrow}
          <h1 className="h1">Nothing due today.</h1>
          <p className="lead">Banked sentences come back after 1, 3, 7, 14 and 30 days. Each time you fix one from memory, the gap grows.</p>
          <div className="row g8">
            <Link href="/bank" className="btn secondary">See your bank</Link>
            <Link href="/" className="btn">Back to Today</Link>
          </div>
        </main>
      </AppShell>
    );
  }

  if (idx >= items.length) {
    return (
      <AppShell>
        <main className="container narrow">
          {eyebrow}
          <h1 className="h1">{score === items.length ? "All fixed from memory." : `${score} of ${items.length} fixed from memory.`}</h1>
          <p className="lead">
            Remembering a fix after a gap is what makes it stick. {score < items.length ? "The ones you missed come back tomorrow." : "The gaps get longer now."}
          </p>
          <div className="row g8">
            <Link href="/bank" className="btn secondary">See your bank</Link>
            <Link href="/" className="btn">Back to Today</Link>
          </div>
        </main>
      </AppShell>
    );
  }

  const item = items[idx];
  const text = attempt ?? item.before;
  const live = state.bank.find((b) => b.id === item.id) ?? item;
  const unchanged = text.trim() === item.before.trim();

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
    <AppShell>
      <main className="container mid">
        {eyebrow}
        <div className="meter" aria-hidden="true">
          <span style={{ width: `${((idx + (result ? 1 : 0)) / items.length) * 100}%`, background: "var(--chart-blue)" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 24, alignItems: "start" }}>
          <section className="panel stack g16" style={{ padding: 28 }}>
            <div className="stack g6">
              <span className="eyebrow amber">{ROWS[item.row]?.label} · {item.label}</span>
              <h1 className="h2">Fix it again, from memory.</h1>
              <p className="body">This is how the sentence looked before you fixed it. Don’t look anything up.</p>
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
                style={{ fontFamily: "var(--serif)", fontSize: 19, lineHeight: 1.5 }}
              />
            </div>
            {error && <div className="error" role="alert">{error}</div>}
            {!result ? (
              <button className="btn" style={{ alignSelf: "flex-start" }} onClick={check} disabled={checking || unchanged}>
                {checking ? "Checking…" : unchanged ? "Change the sentence, then check" : "Check"}
              </button>
            ) : (
              <p className="body" aria-live="polite" style={{ color: result.ok ? "var(--blue)" : "var(--ink-2)", fontWeight: 500 }}>
                {result.ok && <Check size={14} color="var(--blue)" />} {result.comment}
              </p>
            )}
          </section>

          <aside className="stack g16">
            {result ? (
              <>
                <section className="card blue">
                  <span className="eyebrow blue">Your banked version</span>
                  <p className="bank-after">{item.after}</p>
                  {item.transfer && <p className="small"><strong style={{ color: "var(--ink)" }}>Your own example:</strong> {item.transfer}</p>}
                </section>
                <p className="small">{nextReviewLabel(live, today)}.</p>
                <button className="btn block" onClick={next}>{idx + 1 < items.length ? "Next sentence" : "Finish"}</button>
              </>
            ) : (
              <section className="card flat">
                <span className="eyebrow">Why from memory?</span>
                <p className="body" style={{ fontSize: 14 }}>
                  Pulling a fix out of memory, after a gap, makes it far more likely you’ll use it in your own writing. Your banked version appears once you check.
                </p>
              </section>
            )}
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
