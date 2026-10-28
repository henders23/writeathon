"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import AppShell, { SessionShell } from "@/components/AppShell";
import { Check } from "@/components/Icons";
import Loading from "@/components/Loading";
import Marked from "@/components/Marked";
import RewriteIt from "@/components/RewriteIt";
import { useSessionFeedback } from "@/components/useSessionFeedback";
import { MOVES, REQUEST_LABEL, ROWS, TARGET_WORDS, WARMUP_WORDS, type MoveId } from "@/lib/content";
import { parseDay } from "@/lib/dates";
import { clearFeedbackError, requestFeedback } from "@/lib/feedbackRunner";
import { splitSentences } from "@/lib/match";
import { MILESTONES, areasShownWell, counts, currentStreak, lastAttempt } from "@/lib/progress";
import { useAppState } from "@/lib/store";
import type { Feedback, SentenceNote, Session } from "@/lib/types";

const moveLabel = (m: string) => MOVES[m as MoveId]?.label ?? m;

/** Sentence notes from the feedback, or a fallback built from the strengths and the sentence to rewrite. */
function rowsFor(session: Session, fb: Feedback): SentenceNote[] {
  if (fb.sentences && fb.sentences.length) return fb.sentences;
  const sents = splitSentences(session.text);
  return sents.map((text, i) => {
    const work = fb.workOn && (text.includes(fb.workOn.said) || fb.workOn.said.includes(text));
    const strength = fb.strengths.find((s) => s.quote && text.includes(s.quote));
    const move = (session.outline?.[i]?.move ?? (i === 0 ? "claim" : i === sents.length - 1 ? "sowhat" : "explain")) as MoveId;
    return work
      ? { text, move, kind: "work" as const, note: fb.workOn!.comment }
      : strength
        ? { text, move, kind: "strength" as const, note: strength.comment }
        : { text, move, kind: "none" as const, note: "" };
  });
}

export default function FeedbackPage() {
  const { id } = useParams<{ id: string }>();
  const state = useAppState();
  const session = state?.sessions.find((s) => s.id === id);
  const [showModel, setShowModel] = useState(false);
  useSessionFeedback(session);

  if (!state) return <Loading />;
  if (!session || !state.profile) {
    return (
      <AppShell>
        <main className="container narrow">
          <h1 className="h1">We couldn’t find that paragraph</h1>
          <p className="lead">It may have been written in another browser.</p>
          <Link href="/" className="btn" style={{ alignSelf: "flex-start" }}>Back to Today</Link>
        </main>
      </AppShell>
    );
  }

  const streak = currentStreak(state.profile, state.sessions);
  const next = MILESTONES.find((m) => m.days > streak);
  const fb = session.feedback;
  const target = session.warmup ? WARMUP_WORDS : TARGET_WORDS;
  const mins = Math.floor(session.writeSeconds / 60);
  const secs = session.writeSeconds % 60;
  const prev = lastAttempt(state.sessions, session.promptId, session.date);
  const prevAreas = prev ? areasShownWell(prev) : null;
  const nowAreas = areasShownWell(session);
  const unsureText = session.unsure !== undefined ? splitSentences(session.text)[session.unsure] : undefined;

  return (
    <SessionShell step={3} label={session.warmup ? "Warm-up" : session.topic}>
      <main className="container">
        <div className="row between wrap g16" style={{ alignItems: "flex-end" }}>
          <div className="stack g8" style={{ maxWidth: 860 }}>
            <p className="eyebrow">{session.topic}</p>
            <h1 className="h1">{fb ? "Your feedback, in the margins" : session.feedbackError ? "Feedback didn’t arrive" : "Reading your paragraph…"}</h1>
            {fb?.summary && <p className="lead" data-dict="Feedback">{fb.summary}</p>}
          </div>
          <div className="row g24">
            <Stat value={String(session.words)} label={`words · aim ${target.min}–${target.max}`} />
            <Stat value={`${mins}:${String(secs).padStart(2, "0")}`} label="writing time" />
            <Stat value={String(streak)} label={counts(session) ? (next ? `day streak · ${next.days - streak} to ${next.days}` : "day streak") : "day streak · 40+ words to count"} />
          </div>
        </div>

        {!fb && !session.feedbackError && (
          <div className="panel stack g12" role="status" style={{ padding: 48, alignItems: "center" }}>
            <div className="spinner" />
            <p className="body">Your tutor is reading each sentence. This takes about 20 seconds.</p>
            <p className="paragraph" style={{ maxWidth: 760 }}>{session.text}</p>
          </div>
        )}

        {session.feedbackError && (
          <div className="stack g10" style={{ maxWidth: 720 }}>
            <div className="error" role="alert">{session.feedbackError}</div>
            <button className="btn secondary" style={{ alignSelf: "flex-start" }} onClick={() => { clearFeedbackError(session.id); void requestFeedback(session.id); }}>
              Try again
            </button>
          </div>
        )}

        {fb && (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 24, alignItems: "start" }} className="fb-grid">
            <section className="panel" style={{ padding: "16px 28px 24px" }} aria-labelledby="margins-h">
              <div className="row between wrap g8" style={{ padding: "8px 0 12px", borderBottom: "1px solid var(--line)" }}>
                <h2 id="margins-h" className="eyebrow">Your paragraph, sentence by sentence</h2>
                <span className="legend">
                  <span><span className="swatch" style={{ background: "var(--chart-blue)" }} />Went well</span>
                  {fb.workOn && <span><span className="swatch" style={{ background: "var(--chart-amber)" }} />Rewrite this one</span>}
                  <span><span className="swatch" style={{ background: "var(--line-2)" }} />What it does</span>
                </span>
              </div>
              {rowsFor(session, fb).map((r, i) => {
                const isWork = r.kind === "work" && fb.workOn;
                const isUnsure = unsureText && (r.text === unsureText || r.text.includes(unsureText) || unsureText.includes(r.text));
                return (
                  <div key={i} className={`margin-row${isWork ? " work" : ""}`}>
                    <span className="move-tag">{moveLabel(r.move)}</span>
                    <div className="stack g10">
                      <p className="sentence" data-dict={session.topic}>
                        <span className={r.kind === "strength" ? "hl-strength" : isWork && session.banked ? "hl-work" : undefined}>{r.text}</span>
                      </p>
                      {isUnsure && <span className="pill line" style={{ alignSelf: "flex-start" }}>You weren’t sure about this one</span>}
                      {isWork && fb.workOn && <RewriteIt session={session} workOn={fb.workOn} />}
                    </div>
                    <div className="note">
                      {r.kind === "strength" && <span className="t">Went well</span>}
                      {isWork && fb.workOn && (
                        <>
                          <span className="t">{ROWS[fb.workOn.row]?.label} · {fb.workOn.label}</span>
                          <span>{fb.workOn.comment}</span>
                        </>
                      )}
                      {!isWork && r.note && <span>{r.note}</span>}
                    </div>
                  </div>
                );
              })}
              {fb.strengths.length > 0 && (
                <div className="stack g12" style={{ borderTop: "1px solid var(--line)", paddingTop: 16, marginTop: 8 }}>
                  <span className="eyebrow blue">What went well</span>
                  <div className="grid2">
                    {fb.strengths.map((s, i) => (
                      <div key={i} className="card tight blue">
                        <span className="eyebrow blue">{ROWS[s.row]?.label ?? s.row} · {s.label}</span>
                        {s.quote && <p className="quote" style={{ fontSize: 16 }}>“{s.quote}”</p>}
                        <span className="body" style={{ fontSize: 14, color: "var(--blue-strong)" }}>{s.comment}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <aside className="stack g16">
              {(fb.requestAnswers?.length ?? 0) > 0 && (
                <section className="card" aria-labelledby="asked-h">
                  <h2 id="asked-h" className="eyebrow">You asked about</h2>
                  {fb.requestAnswers!.map((a, i) => (
                    <div key={i} className="stack g4">
                      <strong style={{ fontSize: 15 }}>{REQUEST_LABEL[a.request] ?? a.request}</strong>
                      <span className="body" style={{ fontSize: 14 }} data-dict="Feedback">{a.answer}</span>
                    </div>
                  ))}
                </section>
              )}

              {session.outline && session.outline.length > 0 && <PlanVsParagraph session={session} rows={rowsFor(session, fb)} />}

              {fb.transfer.length > 0 && (
                <section className="card blue" aria-label="You used it again">
                  <span className="eyebrow blue">You used it again</span>
                  {fb.transfer.map((t, i) => (
                    <div key={i} className="stack g4">
                      <strong style={{ fontSize: 14, color: "var(--blue-strong)" }}>{t.label}</strong>
                      <p className="quote" style={{ fontSize: 16 }}>“{t.quote}”</p>
                    </div>
                  ))}
                  <span className="small" style={{ color: "var(--blue)" }}>A pattern from your bank, used without being asked. That’s learning.</span>
                </section>
              )}

              {prev && (
                <section className="card amber" aria-label="Compared with your last attempt">
                  <span className="eyebrow amber">Same question: then and now</span>
                  <div className="grid2" style={{ gap: 10 }}>
                    <div className="stack g4">
                      <span className="small">{parseDay(prev.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                      <span className="num" style={{ fontSize: 22 }}>{prev.words} words</span>
                      {prevAreas !== null && <span className="small">{prevAreas} of 5 areas shown well</span>}
                    </div>
                    <div className="stack g4">
                      <span className="small" style={{ color: "var(--amber-text)", fontWeight: 600 }}>Today</span>
                      <span className="num" style={{ fontSize: 22 }}>{session.words} words</span>
                      {nowAreas !== null && <span className="small">{nowAreas} of 5 areas shown well</span>}
                    </div>
                  </div>
                </section>
              )}

              {fb.modelParagraph && (
                <section className="card" aria-labelledby="model-h">
                  <h2 id="model-h" className="eyebrow">Compare with a model</h2>
                  {!showModel ? (
                    <>
                      <span className="body" style={{ fontSize: 14 }}>
                        {session.banked || session.rewrites?.some((r) => r.ok)
                          ? "See how a strong writer might answer the same question. Look for one move you could borrow."
                          : "Try your rewrite first. Then see how a strong writer might answer the same question."}
                      </span>
                      <button className="btn secondary small" style={{ alignSelf: "flex-start" }} onClick={() => setShowModel(true)}>Show the model paragraph</button>
                    </>
                  ) : (
                    <>
                      <p className="paragraph" style={{ fontSize: 16 }} data-dict="Model paragraph">{fb.modelParagraph}</p>
                      <span className="small">A model, not the answer. Which sentence does something yours doesn’t? Select any useful word to add it to your dictionary.</span>
                    </>
                  )}
                </section>
              )}

              <div className="stack g8">
                <Link href="/progress" className="btn secondary">See your progress</Link>
                <Link href="/" className="btn">Done for today</Link>
              </div>
            </aside>
          </div>
        )}

        {fb && !fb.sentences?.length && fb.strengths.length === 0 && !fb.workOn && (
          <section className="card">
            <Marked text={session.text} marks={[]} />
          </section>
        )}
      </main>
    </SessionShell>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stack g4">
      <span className="num" style={{ fontSize: 30, lineHeight: 1 }}>{value}</span>
      <span className="small">{label}</span>
    </div>
  );
}

function PlanVsParagraph({ session, rows }: { session: Session; rows: SentenceNote[] }) {
  const outline = session.outline ?? [];
  const n = Math.max(outline.length, rows.length);
  const matched = outline.filter((o, i) => rows[i]?.move === o.move).length;
  return (
    <section className="card" aria-labelledby="pvp-h">
      <div className="row between">
        <h2 id="pvp-h" className="eyebrow">Your plan vs your paragraph</h2>
        <span className="small">{matched} of {outline.length} as planned</span>
      </div>
      <table className="table-view">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Planned</th>
            <th scope="col">Wrote</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: n }, (_, i) => {
            const p = outline[i]?.move;
            const w = rows[i]?.move;
            const same = p && w && p === w;
            return (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{p ? moveLabel(p) : <span className="small">–</span>}</td>
                <td>
                  {w ? moveLabel(w) : <span className="small">–</span>} {same && <Check size={11} color="var(--blue)" />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <span className="small">
        {matched === outline.length && rows.length === outline.length
          ? "You wrote exactly the paragraph you planned."
          : "Changing your plan while writing is fine. Ask: did each change make the paragraph stronger?"}
      </span>
    </section>
  );
}

