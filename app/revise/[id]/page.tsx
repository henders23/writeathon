"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { Close, Repeat } from "@/components/Icons";
import Loading from "@/components/Loading";
import { clearRevisionError, requestRevision } from "@/lib/feedbackRunner";
import { counts, currentStreak } from "@/lib/progress";
import { useAppState } from "@/lib/store";
import type { RevisionLevel } from "@/lib/types";

const LEVELS: { id: RevisionLevel; label: string }[] = [
  { id: "idea", label: "Ideas" },
  { id: "structure", label: "Structure" },
  { id: "sentence", label: "Sentences" },
  { id: "word", label: "Words" },
];

export default function RevisionResultPage() {
  const { id } = useParams<{ id: string }>();
  const state = useAppState();
  const session = state?.sessions.find((s) => s.id === id);
  const original = session?.revisionOf ? state?.sessions.find((s) => s.id === session.revisionOf) : undefined;
  const needs = Boolean(session && original && !session.revision && !session.revisionError);

  useEffect(() => {
    if (needs && id) void requestRevision(id);
  }, [needs, id]);

  if (!state) return <Loading />;
  if (!session || !original || !state.profile) {
    return (
      <main className="shell">
        <div className="page">
          <p className="body">We couldn&apos;t find that revision on this device.</p>
          <Link href="/" className="btn">Back to Today</Link>
        </div>
      </main>
    );
  }

  const streak = currentStreak(state.profile, state.sessions);
  const r = session.revision;
  const countBy = (lvl: RevisionLevel) => r?.changes.filter((c) => c.level === lvl).length ?? 0;

  return (
    <main className="shell">
      <div className="page">
        <div className="row between">
          <div className="row gap-8">
            <Repeat size={18} color="var(--blue)" />
            <span className="eyebrow blue">Revision complete</span>
          </div>
          <Link href="/" className="icon-btn" aria-label="Close">
            <Close />
          </Link>
        </div>

        <div className="stack gap-4">
          <h1 className="h1" style={{ fontSize: 28 }}>{counts(session) ? `Streak kept: day ${streak}.` : "Revision saved."}</h1>
          <span className="small">{original.words} words before, {session.words} after.</span>
        </div>

        {!r && !session.revisionError && (
          <div className="card center" role="status">
            <div className="spinner" />
            <p className="body">Comparing your two versions…</p>
          </div>
        )}
        {session.revisionError && (
          <div className="stack gap-10">
            <div className="error" role="alert">{session.revisionError}</div>
            <button className="btn secondary" onClick={() => { clearRevisionError(session.id); void requestRevision(session.id); }}>Try again</button>
          </div>
        )}

        {r && (
          <>
            <p className="body">{r.summary}</p>
            <section className="stack gap-10" aria-label="Where you revised">
              <span className="eyebrow">Where you revised</span>
              <div className="levels">
                {LEVELS.map((l) => (
                  <div key={l.id} className={countBy(l.id) ? "on" : ""}>
                    <span className="serif" style={{ fontSize: 24 }}>{countBy(l.id)}</span>
                    <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{l.label}</span>
                  </div>
                ))}
              </div>
              <p className="small" style={{ color: r.deeper ? "var(--blue)" : "var(--amber-text)" }}>
                {r.deeper
                  ? "You changed ideas or structure, not just words. That's how experienced writers revise."
                  : "These were sentence and word changes. Next time, try changing an idea or the order too."}
              </p>
            </section>

            <section className="stack gap-10" aria-label="What changed">
              {r.changes.map((c, i) => (
                <div key={i} className="card tight row gap-10" style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <span className={`level ${c.level}`}>{c.level}</span>
                  <span className="body grow" style={{ fontSize: 14 }}>{c.what}</span>
                </div>
              ))}
            </section>

            <section className="card amber tight" aria-label="Next step">
              <span className="eyebrow amber">If you revised it again</span>
              <p className="body" style={{ fontSize: 14, color: "var(--ink-2)" }}>{r.nextStep}</p>
            </section>
          </>
        )}

        <section className="stack gap-10" aria-label="Before and after">
          <details className="card tight">
            <summary className="eyebrow" style={{ cursor: "pointer", minHeight: 28 }}>Before</summary>
            <p className="paragraph" style={{ fontSize: 16, color: "var(--muted)" }}>{original.text}</p>
          </details>
          <div className="card tight">
            <span className="eyebrow blue">After</span>
            <p className="paragraph" style={{ fontSize: 16 }}>{session.text}</p>
          </div>
        </section>

        <Link href="/" className="btn" style={{ marginTop: "auto" }}>Done</Link>
      </div>
    </main>
  );
}
