"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import AppShell from "@/components/AppShell";
import { Repeat } from "@/components/Icons";
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
      <AppShell>
        <main className="container narrow">
          <h1 className="h1">Revision not found</h1>
          <p className="lead">We couldn’t find that revision on this device.</p>
          <Link href="/" className="btn" style={{ alignSelf: "flex-start" }}>Back to Today</Link>
        </main>
      </AppShell>
    );
  }

  const streak = currentStreak(state.profile, state.sessions);
  const r = session.revision;
  const countBy = (lvl: RevisionLevel) => r?.changes.filter((c) => c.level === lvl).length ?? 0;

  return (
    <AppShell>
      <main className="container">
        <div className="row between wrap g16" style={{ alignItems: "flex-end" }}>
          <div className="stack g6">
            <span className="row g8">
              <Repeat size={18} color="var(--blue)" />
              <span className="eyebrow blue">Revision complete</span>
            </span>
            <h1 className="h1">{counts(session) ? `Streak kept: day ${streak}.` : "Revision saved."}</h1>
            <span className="small">{original.words} words before, {session.words} after.</span>
          </div>
          <Link href="/" className="btn">Done</Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 24, alignItems: "start" }}>
          <section className="stack g16" aria-label="Before and after">
            <div className="card">
              <span className="eyebrow">Before</span>
              <p className="paragraph" style={{ fontSize: 17, color: "var(--muted)" }}>{original.text}</p>
            </div>
            <div className="card">
              <span className="eyebrow blue">After</span>
              <p className="paragraph" style={{ fontSize: 17, color: "var(--ink)" }} data-dict="Your revision">{session.text}</p>
            </div>
          </section>

          <section className="stack g16">
            {!r && !session.revisionError && (
              <div className="card" role="status" style={{ alignItems: "center", textAlign: "center" }}>
                <div className="spinner" />
                <p className="body">Comparing your two versions…</p>
              </div>
            )}
            {session.revisionError && (
              <div className="stack g10">
                <div className="error" role="alert">{session.revisionError}</div>
                <button className="btn secondary" style={{ alignSelf: "flex-start" }} onClick={() => { clearRevisionError(session.id); void requestRevision(session.id); }}>Try again</button>
              </div>
            )}

            {r && (
              <>
                <p className="lead">{r.summary}</p>
                <section className="card" aria-label="Where you revised">
                  <span className="eyebrow">Where you revised</span>
                  <div className="levels">
                    {LEVELS.map((l) => (
                      <div key={l.id} className={countBy(l.id) ? "on" : ""}>
                        <span className="serif" style={{ fontSize: 26 }}>{countBy(l.id)}</span>
                        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="small" style={{ color: r.deeper ? "var(--blue)" : "var(--amber-text)" }}>
                    {r.deeper
                      ? "You changed ideas or structure, not just words. That’s how experienced writers revise."
                      : "These were sentence and word changes. Next time, try changing an idea or the order too."}
                  </p>
                </section>

                <section className="stack g8" aria-label="What changed">
                  {r.changes.map((c, i) => (
                    <div key={i} className="card tight" style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                      <span className={`level ${c.level}`}>{c.level}</span>
                      <span className="body grow" style={{ fontSize: 14 }}>{c.what}</span>
                    </div>
                  ))}
                </section>

                <section className="card amber" aria-label="Next step">
                  <span className="eyebrow amber">If you revised it again</span>
                  <p className="body" style={{ fontSize: 14, color: "var(--ink-2)" }}>{r.nextStep}</p>
                </section>
              </>
            )}
          </section>
        </div>
      </main>
    </AppShell>
  );
}
