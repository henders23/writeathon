"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Close } from "@/components/Icons";
import Loading from "@/components/Loading";
import Marked from "@/components/Marked";
import RewriteIt from "@/components/RewriteIt";
import Stepper from "@/components/Stepper";
import { useSessionFeedback } from "@/components/useSessionFeedback";
import { ROWS, TARGET_WORDS } from "@/lib/content";
import { clearFeedbackError, requestFeedback } from "@/lib/feedbackRunner";
import { MILESTONES, counts, currentStreak } from "@/lib/progress";
import { useAppState } from "@/lib/store";

export default function FeedbackPage() {
  const { id } = useParams<{ id: string }>();
  const state = useAppState();
  const session = state?.sessions.find((s) => s.id === id);
  useSessionFeedback(session);

  if (!state) return <Loading />;
  if (!session || !state.profile) {
    return (
      <main className="shell">
        <div className="page">
          <p className="body">We couldn&apos;t find that paragraph on this device.</p>
          <Link href="/" className="btn">Back to Today</Link>
        </div>
      </main>
    );
  }

  const streak = currentStreak(state.profile, state.sessions);
  const next = MILESTONES.find((m) => m.days > streak);
  const fb = session.feedback;
  const mins = Math.floor(session.writeSeconds / 60);
  const secs = session.writeSeconds % 60;
  const inRange = session.words >= TARGET_WORDS.min;

  return (
    <main className="shell">
      <div className="page">
        <div className="row between">
          <p className="eyebrow">Paragraph complete</p>
          <Link href="/" className="icon-btn" aria-label="Close">
            <Close />
          </Link>
        </div>
        <Stepper current={fb ? (session.banked ? 5 : 4) : 3} />

        <div className="row gap-16">
          <div style={{ width: 76, height: 76, borderRadius: 38, background: "var(--ink)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span className="serif" style={{ fontSize: 32, lineHeight: 1, color: "var(--card)" }}>{streak}</span>
            <span style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--night-amber)" }}>{streak === 1 ? "day" : "days"}</span>
          </div>
          <div className="stack gap-4">
            <h1 className="h1" style={{ fontSize: 28 }}>{counts(session) ? (streak === 1 ? "Streak started." : "Streak kept.") : "Thanks for writing."}</h1>
            <span style={{ fontSize: 14, color: "var(--muted)" }}>
              {counts(session)
                ? next
                  ? `${next.days - streak} day${next.days - streak === 1 ? "" : "s"} to your ${next.days}-day milestone`
                  : "You've passed every milestone."
                : "Write at least 40 words for it to count towards your streak."}
            </span>
          </div>
        </div>

        <div className="rule">
          {session.words} words in {mins > 0 ? `${mins} min ` : ""}
          {secs} s{inRange ? "." : `. Next time, aim for ${TARGET_WORDS.min}+.`}
        </div>

        {!fb && !session.feedbackError && (
          <div className="card center" role="status">
            <div className="spinner" />
            <p className="body">Reading your paragraph…</p>
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
            {fb.summary && <p className="body">{fb.summary}</p>}

            <section className="card" aria-labelledby="yours">
              <div className="row between">
                <h2 id="yours" className="eyebrow">Your paragraph</h2>
                <span className="row gap-10" style={{ fontSize: 12, color: "var(--ink-3)" }}>
                  <span className="row gap-4"><span className="dot blue" />Went well</span>
                  {fb.workOn && <span className="row gap-4"><span className="dot amber" />Rewrite</span>}
                </span>
              </div>
              <Marked
                text={session.text}
                marks={[
                  ...(fb.workOn ? [{ quote: fb.workOn.said, className: "mark-work", label: "Sentence to rewrite" }] : []),
                  ...fb.strengths.map((s) => ({ quote: s.quote, className: "mark-strength", label: "Went well" })),
                ]}
              />
            </section>

            {fb.transfer.length > 0 && (
              <section className="card blue" aria-label="You used it again">
                <span className="eyebrow blue">You used it again</span>
                {fb.transfer.map((t, i) => (
                  <div key={i} className="stack gap-4">
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{t.label}</span>
                    <p className="quote" style={{ fontSize: 17 }}>“{t.quote}”</p>
                  </div>
                ))}
                <p className="small" style={{ color: "#3B4A60" }}>A pattern from your bank, used without being asked. That&apos;s what learning looks like.</p>
              </section>
            )}

            {fb.strengths.length > 0 && (
              <section className="stack gap-12" aria-labelledby="well">
                <div className="row gap-8">
                  <span className="dot blue" />
                  <h2 id="well" className="eyebrow blue">What went well</h2>
                </div>
                {fb.strengths.map((s, i) => (
                  <div key={i} className="card tight">
                    <div className="stack gap-2">
                      <span className="eyebrow blue">{ROWS[s.row]?.label ?? s.row}</span>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{s.label}</span>
                    </div>
                    {s.quote && <p className="quote">“{s.quote}”</p>}
                    <p className="body" style={{ fontSize: 14 }}>{s.comment}</p>
                  </div>
                ))}
              </section>
            )}

            {fb.workOn && (
              <section className="stack gap-12" aria-labelledby="work">
                <div className="row gap-8">
                  <span className="dot amber" />
                  <h2 id="work" className="eyebrow amber">One sentence to rewrite</h2>
                </div>
                <div className="card amber" style={{ padding: 16, gap: 12 }}>
                  <div className="stack gap-2">
                    <span className="eyebrow amber">{ROWS[fb.workOn.row]?.label ?? fb.workOn.row}</span>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{fb.workOn.label}</span>
                  </div>
                  <div className="stack gap-4">
                    <span style={{ fontSize: 13, color: "#6A5030" }}>You wrote</span>
                    <p className="serif" style={{ margin: 0, fontSize: 18, lineHeight: 1.35, color: "var(--ink-2)" }}>“{fb.workOn.said}”</p>
                  </div>
                  <p className="body" style={{ fontSize: 14, color: "var(--ink-2)" }}>{fb.workOn.comment}</p>
                  <RewriteIt session={session} workOn={fb.workOn} />
                </div>
              </section>
            )}
          </>
        )}

        <div className="stack gap-10" style={{ marginTop: "auto" }}>
          <Link href="/pattern" className="btn secondary">See your pattern</Link>
          <Link href="/" className="btn">Done</Link>
        </div>
      </div>
    </main>
  );
}
