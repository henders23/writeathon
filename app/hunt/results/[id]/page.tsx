"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Arrow, Close, Search } from "@/components/Icons";
import Loading from "@/components/Loading";
import { useSessionFeedback } from "@/components/useSessionFeedback";
import { clearFeedbackError, requestFeedback } from "@/lib/feedbackRunner";
import { bestHuntThisWeek, counts, currentStreak, huntScore } from "@/lib/progress";
import { useAppState } from "@/lib/store";
import type { HuntVerdict } from "@/lib/types";

const LABEL: Record<HuntVerdict, string> = { natural: "Natural", close: "Not quite", missed: "Missed" };
const PILL: Record<HuntVerdict, string> = { natural: "strength", close: "develop", missed: "missed" };

export default function HuntResults() {
  const { id } = useParams<{ id: string }>();
  const state = useAppState();
  const session = state?.sessions.find((s) => s.id === id);
  useSessionFeedback(session);

  if (!state) return <Loading />;
  if (!session || !state.profile) {
    return (
      <main className="shell">
        <div className="page">
          <p className="body">We couldn&apos;t find that game on this device.</p>
          <Link href="/" className="btn">Back to Today</Link>
        </div>
      </main>
    );
  }

  const fb = session.feedback;
  const score = huntScore(session);
  const best = bestHuntThisWeek(state.sessions);
  const streak = currentStreak(state.profile, state.sessions);
  const found = fb?.hunt.filter((h) => h.verdict !== "missed").length ?? 0;
  const hinted = new Set(session.hintsUsed ?? []);

  return (
    <main className="shell">
      <div className="page" style={{ gap: 20 }}>
        <div className="row between">
          <div className="row gap-8">
            <Search color="var(--amber)" />
            <span className="eyebrow amber">Phrase Hunt complete</span>
          </div>
          <Link href="/" className="icon-btn" aria-label="Close">
            <Close />
          </Link>
        </div>

        {!fb && !session.feedbackError && (
          <div className="card center" role="status">
            <div className="spinner" />
            <p className="body">Scoring your hunt…</p>
          </div>
        )}
        {session.feedbackError && (
          <div className="stack gap-10">
            <div className="error" role="alert">{session.feedbackError}</div>
            <button className="btn secondary" onClick={() => { clearFeedbackError(session.id); void requestFeedback(session.id); }}>
              Try again
            </button>
          </div>
        )}

        {fb && (
          <>
            <div className="row between" style={{ alignItems: "flex-end" }}>
              <div className="row gap-6" style={{ alignItems: "baseline" }}>
                <span className="serif" style={{ fontSize: 64, lineHeight: 1, fontWeight: 500 }}>{score.points}</span>
                <span className="serif" style={{ fontSize: 26, color: "var(--muted)" }}>/ {score.max}</span>
              </div>
              {best !== null && (
                <div className="stack gap-2" style={{ alignItems: "flex-end", paddingBottom: 6 }}>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>Your best this week</span>
                  <span className="serif" style={{ fontSize: 20 }}>{best}</span>
                </div>
              )}
            </div>
            <div className="rule">
              {found} of {fb.hunt.length} found{score.hints ? `, ${score.hints} hint${score.hints === 1 ? "" : "s"} used` : ""}.{" "}
              {counts(session) ? `Streak kept: day ${streak}.` : ""}
            </div>
            <div className="stack gap-10">
              {fb.hunt.map((r, i) => {
                const pts = r.verdict === "natural" ? 3 : r.verdict === "close" ? 1 : 0;
                const withHint = hinted.has(i);
                return (
                  <div key={i} className="card tight">
                    <div className="row gap-10">
                      <span className="serif grow" style={{ fontSize: 20, lineHeight: 1.2 }}>{session.huntItems?.[i]?.phrase ?? r.item}</span>
                      <span className={`pill ${PILL[r.verdict]}`}>{LABEL[r.verdict]}{withHint ? " · hint" : ""}</span>
                      <span className="serif" style={{ width: 22, textAlign: "right", fontSize: 20, color: r.verdict === "natural" ? "var(--blue)" : r.verdict === "close" ? "var(--amber-text)" : "var(--ink-3)" }}>
                        {Math.max(0, pts - (withHint ? 1 : 0))}
                      </span>
                    </div>
                    {r.quote && <p className="quote" style={{ fontSize: 16, color: "var(--ink-2)" }}>“{r.quote}”</p>}
                    {r.note && <p className="body" style={{ fontSize: 14 }}>{r.note}</p>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="stack gap-10" style={{ marginTop: "auto" }}>
          <Link href={`/feedback/${session.id}`} className="btn secondary">
            <span>See your feedback and rewrite</span>
            <Arrow />
          </Link>
          <Link href="/" className="btn">Done</Link>
        </div>
      </div>
    </main>
  );
}
