"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Close, Scissors } from "@/components/Icons";
import Loading from "@/components/Loading";
import Onboarding from "@/components/Onboarding";
import { postJSON } from "@/lib/api";
import { FALLBACK_SURGERY, SURGERY_SECONDS, type SurgeryItem } from "@/lib/content";
import { dayKey } from "@/lib/dates";
import { DISCIPLINE_LABEL } from "@/lib/disciplines";
import { bestSurgeryThisWeek, todaysPrompt } from "@/lib/progress";
import { update, useAppState } from "@/lib/store";

type Result = { attempt: string; ok: boolean; comment: string; hinted: boolean };

export default function SurgeryPage() {
  const state = useAppState();
  const today = dayKey();
  const profile = state?.profile;
  const prompt = profile ? todaysPrompt(profile, today) : null;
  const cache = state?.surgeryCache;
  const items: SurgeryItem[] | null = cache && prompt && cache.date === today && cache.promptId === prompt.id ? cache.items : null;

  const [notice, setNotice] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [left, setLeft] = useState(SURGERY_SECONDS);
  const [idx, setIdx] = useState(0);
  const [attempt, setAttempt] = useState("");
  const [hinted, setHinted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);
  const saved = useRef(false);

  useEffect(() => {
    if (!prompt || items || !profile) return;
    let cancelled = false;
    postJSON<{ items: SurgeryItem[] }>("/api/surgery", { topic: prompt.topic, promptText: prompt.text, discipline: DISCIPLINE_LABEL[profile.discipline] })
      .then((r) => !cancelled && update((s) => ({ ...s, surgeryCache: { date: today, promptId: prompt.id, items: r.items } })))
      .catch((e: Error) => {
        if (cancelled) return;
        setNotice(`${e.message} Here's a general set instead.`);
        update((s) => ({ ...s, surgeryCache: { date: today, promptId: prompt.id, items: FALLBACK_SURGERY } }));
      });
    return () => {
      cancelled = true;
    };
  }, [prompt, items, profile, today]);

  const finished = started && (results.length >= (items?.length ?? 3) || (left <= 0 && !checking));

  useEffect(() => {
    if (!started || finished || checking) return;
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, [started, finished, checking]);

  useEffect(() => {
    if (!finished || saved.current || !items) return;
    saved.current = true;
    const points = results.filter((r) => r.ok).length;
    update((s) => ({ ...s, surgeryRuns: [...s.surgeryRuns, { date: today, points, max: items.length }] }));
  }, [finished, results, items, today]);

  if (!state) return <Loading />;
  if (!profile || !prompt) return <Onboarding />;
  if (!items) return <Loading label="Preparing today's operations…" />;

  const item = items[idx];
  const answered = results.length > idx;

  async function check() {
    setError(null);
    setChecking(true);
    try {
      const v = await postJSON<{ ok: boolean; comment: string }>("/api/surgery/check", { sentences: item.sentences, technique: item.technique, model: item.model, attempt });
      setResults((r) => [...r, { attempt: attempt.trim(), ok: v.ok, comment: v.comment, hinted }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't check that.");
    }
    setChecking(false);
  }

  function next() {
    setIdx((i) => i + 1);
    setAttempt("");
    setHinted(false);
  }

  const header = (
    <div className="row between">
      <div className="row gap-8">
        <Scissors color="var(--blue)" />
        <span className="eyebrow blue">Sentence Surgery</span>
      </div>
      <Link href="/" className="icon-btn" aria-label="Close">
        <Close />
      </Link>
    </div>
  );

  if (!started) {
    return (
      <main className="shell">
        <div className="page" style={{ gap: 20 }}>
          {header}
          <div className="stack gap-8">
            <h1 className="h1">Three operations. 90 seconds.</h1>
            <p className="body">
              Each operation is a few short sentences. Join them into one academic sentence that keeps all the information. Skilled writers
              do this all the time.
            </p>
            <p className="small">Today&apos;s topic: {prompt.topic}. The clock pauses while your answer is checked.</p>
          </div>
          {notice && <div className="notice">{notice}</div>}
          <div className="card tight">
            <span className="eyebrow">Example</span>
            <ul className="op">
              <li>The sample was small.</li>
              <li>The results are still useful.</li>
            </ul>
            <span className="serif" style={{ fontSize: 17 }}>→ Although the sample was small, the results are still useful.</span>
          </div>
          <button className="btn" style={{ marginTop: "auto" }} onClick={() => setStarted(true)}>Start the clock</button>
        </div>
      </main>
    );
  }

  if (finished) {
    const points = results.filter((r) => r.ok).length;
    const best = bestSurgeryThisWeek(state.surgeryRuns);
    return (
      <main className="shell">
        <div className="page" style={{ gap: 20 }}>
          {header}
          <div className="row between" style={{ alignItems: "flex-end" }}>
            <div className="row gap-6" style={{ alignItems: "baseline" }}>
              <span className="serif" style={{ fontSize: 64, lineHeight: 1, fontWeight: 500 }}>{points}</span>
              <span className="serif" style={{ fontSize: 26, color: "var(--muted)" }}>/ {items.length}</span>
            </div>
            {best !== null && (
              <div className="stack gap-2" style={{ alignItems: "flex-end", paddingBottom: 6 }}>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>Your best this week</span>
                <span className="serif" style={{ fontSize: 20 }}>{best}</span>
              </div>
            )}
          </div>
          <div className="stack gap-10">
            {items.map((it, i) => {
              const r = results[i];
              return (
                <div key={i} className="card tight">
                  <div className="row between gap-8">
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{it.technique}</span>
                    <span className={`pill ${r?.ok ? "strength" : r ? "develop" : "missed"}`}>{r?.ok ? "Joined" : r ? "Not quite" : "No time"}</span>
                  </div>
                  {r && <p className="quote" style={{ fontSize: 16, color: "var(--ink-2)" }}>“{r.attempt}”</p>}
                  {r?.comment && <p className="body" style={{ fontSize: 14 }}>{r.comment}</p>}
                  <p className="small"><strong>One way:</strong> {it.model}</p>
                </div>
              );
            })}
          </div>
          <div className="stack gap-10" style={{ marginTop: "auto" }}>
            <Link href="/write" className="btn">Now write today&apos;s paragraph</Link>
            <Link href="/" className="btn secondary">Back to Today</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="shell">
      <div className="page" style={{ gap: 18 }}>
        {header}
        <div className="row between">
          <span className="small">Operation {idx + 1} of {items.length}</span>
          <span className={`timer${left <= 15 ? " over" : ""}`} role="timer">{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</span>
        </div>
        <ul className="op" aria-label="Short sentences to join">
          {item.sentences.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
        {hinted ? (
          <div className="hint-step">
            <p className="eyebrow blue">{item.technique}</p>
            {item.hint}
          </div>
        ) : (
          !answered && (
            <button className="text-btn" style={{ alignSelf: "flex-start", fontSize: 14, minHeight: 36, color: "var(--blue)" }} onClick={() => setHinted(true)}>
              Show a hint
            </button>
          )
        )}
        <div className="field">
          <label htmlFor="joined">One sentence</label>
          <textarea
            id="joined"
            rows={3}
            value={attempt}
            autoFocus
            disabled={answered}
            onChange={(e) => setAttempt(e.target.value)}
            onPaste={(e) => e.preventDefault()}
            style={{ fontFamily: "var(--serif)", fontSize: 18 }}
          />
        </div>
        {error && <div className="error" role="alert">{error}</div>}
        {answered ? (
          <>
            <p className="body" aria-live="polite" style={{ color: results[idx].ok ? "var(--blue)" : "var(--ink-2)", fontWeight: 500 }}>
              {results[idx].ok && <Check size={14} color="var(--blue)" />} {results[idx].comment}
            </p>
            {!results[idx].ok && <p className="small"><strong>One way:</strong> {item.model}</p>}
            <button className="btn" onClick={next}>{idx + 1 < items.length ? "Next operation" : "See results"}</button>
          </>
        ) : (
          <button className="btn" onClick={check} disabled={checking || attempt.trim().split(/\s+/).length < 5}>
            {checking ? "Checking…" : "Check"}
          </button>
        )}
      </div>
    </main>
  );
}
