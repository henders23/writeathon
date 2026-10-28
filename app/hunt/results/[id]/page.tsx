"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Arrow, Search } from "@/components/Icons";
import Loading from "@/components/Loading";
import Marked from "@/components/Marked";
import { useSessionFeedback } from "@/components/useSessionFeedback";
import { clearFeedbackError, requestFeedback } from "@/lib/feedbackRunner";
import { bestHuntThisWeek, counts, currentStreak, huntScore } from "@/lib/progress";
import { useAppState } from "@/lib/store";
import type { HuntVerdict } from "@/lib/types";

const LABEL: Record<HuntVerdict, string> = { natural: "Natural", close: "Not quite", missed: "Missed" };
const PILL: Record<HuntVerdict, string> = { natural: "blue", close: "amber", missed: "grey" };

export default function HuntResults() {
  const { id } = useParams<{ id: string }>();
  const state = useAppState();
  const session = state?.sessions.find((s) => s.id === id);
  useSessionFeedback(session);

  if (!state) return <Loading />;
  if (!session || !state.profile) {
    return (
      <AppShell>
        <main className="container narrow">
          <p className="lead">We couldn’t find that game on this device.</p>
          <Link href="/" className="btn" style={{ alignSelf: "flex-start" }}>Back to Today</Link>
        </main>
      </AppShell>
    );
  }

  const fb = session.feedback;
  const score = huntScore(session);
  const best = bestHuntThisWeek(state.sessions);
  const streak = currentStreak(state.profile, state.sessions);
  const found = fb?.hunt.filter((h) => h.verdict !== "missed").length ?? 0;
  const hinted = new Set(session.hintsUsed ?? []);

  return (
    <AppShell>
      <main className="container">
        <div className="row between wrap g16" style={{ alignItems: "flex-end" }}>
          <div className="stack g6">
            <span className="eyebrow amber row g6"><Search size={14} color="var(--amber)" /> Phrase Hunt complete · {session.topic}</span>
            {fb ? (
              <div className="row g8" style={{ alignItems: "baseline" }}>
                <span className="stat" style={{ fontSize: 64 }}>{score.points}</span>
                <span className="num" style={{ fontSize: 26, color: "var(--muted)" }}>/ {score.max}</span>
              </div>
            ) : (
              <h1 className="h1">Scoring your hunt…</h1>
            )}
            {fb && (
              <p className="small" style={{ fontSize: 14 }}>
                {found} of {fb.hunt.length} found{score.hints ? `, ${score.hints} hint${score.hints === 1 ? "" : "s"} used` : ""}.{" "}
                {counts(session) ? `Streak kept: day ${streak}.` : ""}
              </p>
            )}
          </div>
          {fb && best !== null && (
            <div className="card tight" style={{ alignItems: "flex-end" }}>
              <span className="small">Your best this week</span>
              <span className="num" style={{ fontSize: 28 }}>{best}</span>
            </div>
          )}
        </div>

        {!fb && !session.feedbackError && (
          <div className="card" role="status" style={{ alignItems: "center", padding: 40 }}>
            <div className="spinner" />
            <p className="body">Reading your paragraph for the five phrases…</p>
          </div>
        )}
        {session.feedbackError && (
          <div className="stack g10" style={{ maxWidth: 640 }}>
            <div className="error" role="alert">{session.feedbackError}</div>
            <button className="btn secondary" style={{ alignSelf: "flex-start" }} onClick={() => { clearFeedbackError(session.id); void requestFeedback(session.id); }}>
              Try again
            </button>
          </div>
        )}

        {fb && (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)", gap: 24, alignItems: "start" }}>
            <section className="panel stack g12" style={{ padding: 28 }} aria-labelledby="para-h">
              <h2 id="para-h" className="eyebrow">Your paragraph</h2>
              <Marked
                text={session.text}
                marks={fb.hunt
                  .filter((h) => h.quote && h.verdict !== "missed")
                  .map((h) => ({ quote: h.quote, className: h.verdict === "natural" ? "mark-strength" : "mark-work", label: LABEL[h.verdict] }))}
              />
              <div className="legend">
                <span><span className="swatch" style={{ background: "var(--blue)" }} />Natural</span>
                <span><span className="swatch" style={{ background: "var(--amber)" }} />Not quite</span>
              </div>
            </section>

            <section className="stack g12" aria-label="Your five phrases">
              {fb.hunt.map((r, i) => {
                const pts = r.verdict === "natural" ? 3 : r.verdict === "close" ? 1 : 0;
                const withHint = hinted.has(i);
                return (
                  <div key={i} className="card tight">
                    <div className="row g10">
                      <span className="serif grow" style={{ fontSize: 20, lineHeight: 1.2 }}>{session.huntItems?.[i]?.phrase ?? r.item}</span>
                      <span className={`pill ${PILL[r.verdict]}`}>{LABEL[r.verdict]}{withHint ? " · hint" : ""}</span>
                      <span className="num" style={{ width: 24, textAlign: "right", fontSize: 20, color: r.verdict === "natural" ? "var(--blue)" : r.verdict === "close" ? "var(--amber-text)" : "var(--ink-3)" }}>
                        {Math.max(0, pts - (withHint ? 1 : 0))}
                        <span className="sr-only"> points</span>
                      </span>
                    </div>
                    {r.quote && <p className="quote" style={{ fontSize: 16, color: "var(--ink-2)" }}>“{r.quote}”</p>}
                    {r.note && <p className="body" style={{ fontSize: 14 }}>{r.note}</p>}
                  </div>
                );
              })}
            </section>
          </div>
        )}

        <div className="row between wrap g12">
          <Link href="/practice" className="btn secondary">More practice</Link>
          <div className="row g12 wrap">
            <Link href={`/feedback/${session.id}`} className="btn secondary">
              <span>See your feedback and rewrite</span>
              <Arrow />
            </Link>
            <Link href="/" className="btn">Done</Link>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
