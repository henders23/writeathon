"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Close, Search } from "@/components/Icons";
import Loading from "@/components/Loading";
import Onboarding from "@/components/Onboarding";
import { postJSON } from "@/lib/api";
import { FALLBACK_HUNT, type HuntItem } from "@/lib/content";
import { dayKey } from "@/lib/dates";
import { focusForDay, todaysPrompt } from "@/lib/progress";
import { update, useAppState } from "@/lib/store";

const STUDY_SECONDS = 60;

export default function HuntPreview() {
  const state = useAppState();
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(STUDY_SECONDS);
  const today = dayKey();
  const profile = state?.profile;
  const prompt = profile ? todaysPrompt(profile, today) : null;
  const focusId = profile && prompt ? focusForDay(profile, prompt) : undefined;
  const cache = state?.huntCache;
  const items: HuntItem[] | null =
    cache && prompt && cache.date === today && cache.promptId === prompt.id && cache.focusId === focusId ? cache.items : null;

  useEffect(() => {
    if (!focusId || !prompt || items) return;
    let cancelled = false;
    postJSON<{ items: HuntItem[] }>("/api/hunt", { promptText: prompt.text, source: prompt.source, focusId })
      .then((r) => !cancelled && update((s) => ({ ...s, huntCache: { date: today, promptId: prompt.id, focusId, items: r.items } })))
      .catch((e: Error) => {
        if (cancelled) return;
        setError(`${e.message} Here's a general set instead.`);
        update((s) => ({ ...s, huntCache: { date: today, promptId: prompt.id, focusId, items: FALLBACK_HUNT } }));
      });
    return () => {
      cancelled = true;
    };
  }, [focusId, items, prompt, today]);

  useEffect(() => {
    if (!items) return;
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, [items]);

  if (!state) return <Loading />;
  if (!profile || !prompt) return <Onboarding />;
  if (!items) return <Loading label="Choosing today's five…" />;

  return (
    <main className="shell">
      <div className="page" style={{ gap: 20 }}>
        <div className="row between">
          <div className="row gap-8">
            <Search color="var(--amber)" />
            <span className="eyebrow amber">Phrase Hunt</span>
          </div>
          <Link href="/" className="icon-btn" aria-label="Close">
            <Close />
          </Link>
        </div>

        <div className="stack gap-8">
          <h1 className="h1">Five to find.</h1>
          <p className="body">Study these, then they disappear. Use each one naturally in today&apos;s paragraph to score.</p>
          <p className="small">Today: {prompt.text}</p>
        </div>

        <div className="row between card ink" style={{ flexDirection: "row", padding: "12px 16px", borderRadius: 14 }}>
          <span style={{ fontSize: 14 }}>{left > 0 ? "Study time" : "Ready when you are"}</span>
          <span className="serif" style={{ fontSize: 22, fontVariantNumeric: "tabular-nums" }}>
            {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
          </span>
        </div>

        {error && <div className="notice">{error}</div>}

        <div className="stack gap-10">
          {items.map((it, i) => (
            <div key={i} className="card tight row gap-12" style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <span className="serif" style={{ width: 24, flexShrink: 0, fontSize: 18, color: "var(--muted)", paddingTop: 2 }}>{i + 1}</span>
              <div className="stack gap-4 grow">
                <span className="eyebrow" style={{ fontSize: 11 }}>{it.tag}</span>
                <span className="serif" style={{ fontSize: 21, lineHeight: 1.2 }}>{it.phrase}</span>
                <span className="serif" style={{ fontStyle: "italic", fontSize: 15, lineHeight: 1.4, color: "var(--ink-3)" }}>“{it.example}”</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, textAlign: "center" }}>
          <div className="stack gap-2"><span className="serif" style={{ fontSize: 22, color: "var(--blue)" }}>3</span><span style={{ fontSize: 12, color: "var(--ink-3)" }}>Natural and accurate</span></div>
          <div className="stack gap-2"><span className="serif" style={{ fontSize: 22, color: "var(--amber-text)" }}>1</span><span style={{ fontSize: 12, color: "var(--ink-3)" }}>Used, not quite right</span></div>
          <div className="stack gap-2"><span className="serif" style={{ fontSize: 22, color: "var(--ink-3)" }}>−1</span><span style={{ fontSize: 12, color: "var(--ink-3)" }}>Each hint you use</span></div>
        </div>

        <Link href="/write?mode=hunt" className="btn" style={{ marginTop: "auto" }}>
          I&apos;m ready. Hide them.
        </Link>
      </div>
    </main>
  );
}
