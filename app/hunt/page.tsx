"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SessionShell } from "@/components/AppShell";
import { Search } from "@/components/Icons";
import Loading from "@/components/Loading";
import Onboarding from "@/components/Onboarding";
import { postJSON } from "@/lib/api";
import { FALLBACK_HUNT, type HuntItem } from "@/lib/content";
import { dayKey } from "@/lib/dates";
import { focusForDay, getTopic, todaysChoices } from "@/lib/progress";
import { update, useAppState } from "@/lib/store";

const STUDY_SECONDS = 60;

function HuntPreview() {
  const state = useAppState();
  const params = useSearchParams();
  const topicId = params.get("topic");
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(STUDY_SECONDS);
  const today = dayKey();
  const profile = state?.profile;
  const prompt = state && profile ? (topicId ? getTopic(topicId, state) : undefined) ?? todaysChoices(profile, state.sessions, today)[0] : null;
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
    <SessionShell step={0} label="Phrase Hunt">
      <main className="container mid">
        <div className="row between wrap g16" style={{ alignItems: "flex-end" }}>
          <div className="stack g8">
            <span className="eyebrow amber row g6"><Search size={14} color="var(--amber)" /> Phrase Hunt · {prompt.topic}</span>
            <h1 className="h1">Five to find.</h1>
            <p className="lead" style={{ maxWidth: 640 }}>Study these, then they disappear. Use each one naturally in your paragraph to score.</p>
          </div>
          <div className="card tight" style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <span className="small">{left > 0 ? "Study time" : "Ready when you are"}</span>
            <span className="timer" role="timer" aria-label={left > 0 ? `${left} seconds of study time left` : "Study time over"}>
              {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
            </span>
          </div>
        </div>

        <section className="card flat">
          <span className="eyebrow">Today’s task</span>
          <p className="body" style={{ fontSize: 16, color: "var(--ink)" }} data-dict="Writeathon task">{prompt.text}</p>
        </section>

        {error && <div className="notice">{error}</div>}

        <ol className="grid2" style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {items.map((it, i) => (
            <li key={i} className="card" style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
              <span className="move-num" style={{ flexShrink: 0 }}>{i + 1}</span>
              <div className="stack g6 grow">
                <span className="eyebrow">{it.tag}</span>
                <span className="serif" style={{ fontSize: 22, lineHeight: 1.2 }}>{it.phrase}</span>
                <span className="serif" style={{ fontStyle: "italic", fontSize: 16, lineHeight: 1.4, color: "var(--ink-3)" }}>“{it.example}”</span>
              </div>
            </li>
          ))}
        </ol>

        <div className="row between wrap g16">
          <div className="row g24" aria-label="Scoring">
            <span className="row g8"><span className="num" style={{ fontSize: 24, color: "var(--blue)" }}>3</span><span className="small">Natural and accurate</span></span>
            <span className="row g8"><span className="num" style={{ fontSize: 24, color: "var(--amber-text)" }}>1</span><span className="small">Used, not quite right</span></span>
            <span className="row g8"><span className="num" style={{ fontSize: 24, color: "var(--ink-3)" }}>−1</span><span className="small">Each hint you use</span></span>
          </div>
          <Link href={`/session?topic=${encodeURIComponent(prompt.id)}&mode=hunt`} className="btn">
            I’m ready. Hide them and plan.
          </Link>
        </div>
      </main>
    </SessionShell>
  );
}

export default function HuntPage() {
  return (
    <Suspense fallback={<Loading />}>
      <HuntPreview />
    </Suspense>
  );
}
