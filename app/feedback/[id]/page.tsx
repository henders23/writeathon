"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell, { SessionShell } from "@/components/AppShell";
import { Check } from "@/components/Icons";
import Loading from "@/components/Loading";
import Marked from "@/components/Marked";
import RewriteIt from "@/components/RewriteIt";
import { useSessionFeedback } from "@/components/useSessionFeedback";
import { BANDS, CRITERIA, MOVES, REQUEST_LABEL, ROWS, targetFor, type Band, type MoveId } from "@/lib/content";
import { parseDay } from "@/lib/dates";
import { clearFeedbackError, requestFeedback } from "@/lib/feedbackRunner";
import { splitSentences } from "@/lib/match";
import { MILESTONES, areasShownWell, counts, currentStreak, lastAttempt } from "@/lib/progress";
import { useAppState } from "@/lib/store";
import type { CriterionResult, Feedback, SentenceNote, Session } from "@/lib/types";

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
  const nSources = session.sources?.length ?? (session.source ? 1 : 0);
  const target = targetFor(session.warmup, Math.max(1, nSources));
  const mins = Math.floor(session.writeSeconds / 60);
  const secs = session.writeSeconds % 60;
  const prev = lastAttempt(state.sessions, session.promptId, session.date);
  const prevAreas = prev ? areasShownWell(prev) : null;
  const nowAreas = areasShownWell(session);
  const unsureText = session.unsure !== undefined ? splitSentences(session.text)[session.unsure] : undefined;

  const rows = fb ? rowsFor(session, fb) : [];
  const workIsUnsure = Boolean(fb?.workOn && unsureText && (fb.workOn.said.includes(unsureText) || unsureText.includes(fb.workOn.said)));
  const rewriteDone = Boolean(fb) && (!fb?.workOn || Boolean(session.banked));
  const rewritten = Boolean(session.banked || session.rewrites?.some((r) => r.ok));
  const showLevels = fb && (fb.readerEffect || (fb.effectiveness?.length ?? 0) > 0);

  return (
    <SessionShell step={3}>
      <main className="container focus" style={{ maxWidth: 880 }}>
        <div className="stack g10">
          <p className="eyebrow">{session.warmup ? "Warm-up · " : ""}{session.topic}</p>
          <h1 className="h1">
            {fb
              ? fb.workOn && !session.banked
                ? "Your feedback: one sentence to rewrite"
                : "Your feedback"
              : session.feedbackError
                ? "Feedback didn’t arrive"
                : "Reading your paragraph…"}
          </h1>
          {fb?.summary && <p className="lead" data-dict="Feedback">{fb.summary}</p>}
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

        {fb?.workOn && (
          <section className="panel hero" aria-labelledby="rw-h">
            <h2 id="rw-h" className="eyebrow amber">Rewrite this one · {ROWS[fb.workOn.row]?.label} · {fb.workOn.label}</h2>
            <p className="sentence" style={{ fontSize: 22 }} data-dict={session.topic}>
              <span className={session.banked ? "hl-work" : "mark-work"}>{fb.workOn.said}</span>
            </p>
            {workIsUnsure && <span className="pill line" style={{ alignSelf: "flex-start" }}>You weren’t sure about this one</span>}
            <p className="body" data-dict="Feedback">{fb.workOn.comment}</p>
            <RewriteIt session={session} workOn={fb.workOn} />
          </section>
        )}

        {fb && (fb.requestAnswers?.length ?? 0) > 0 && (
          <section className="stack g12" aria-labelledby="asked-h">
            <h2 id="asked-h" className="quiet-h">You asked about</h2>
            {fb.requestAnswers!.map((a, i) => (
              <p key={i} className="body" style={{ fontSize: 16 }} data-dict="Feedback">
                <strong style={{ color: "var(--ink)" }}>{REQUEST_LABEL[a.request] ?? a.request}.</strong> {a.answer}
              </p>
            ))}
          </section>
        )}

        {fb && (fb.strengths.length > 0 || fb.transfer.length > 0) && (
          <section className="stack g12" aria-labelledby="well-h">
            <h2 id="well-h" className="quiet-h">What went well</h2>
            {fb.strengths.map((s, i) => (
              <div key={i} className="row g12" style={{ alignItems: "flex-start" }}>
                <span style={{ marginTop: 3, flexShrink: 0 }}><Check size={16} color="var(--blue)" /></span>
                <p className="body" style={{ fontSize: 16 }}>
                  <strong style={{ color: "var(--ink)" }}>{s.label}.</strong> {s.comment}
                  {s.quote && <span className="serif" style={{ fontStyle: "italic", display: "block", marginTop: 2 }}>“{s.quote}”</span>}
                </p>
              </div>
            ))}
            {fb.transfer.map((t, i) => (
              <div key={`t${i}`} className="row g12" style={{ alignItems: "flex-start" }}>
                <span style={{ marginTop: 3, flexShrink: 0 }}><Check size={16} color="var(--blue)" /></span>
                <p className="body" style={{ fontSize: 16 }}>
                  <strong style={{ color: "var(--ink)" }}>You used it again: {t.label}.</strong> A pattern from your bank, used without being asked.
                  <span className="serif" style={{ fontStyle: "italic", display: "block", marginTop: 2 }}>“{t.quote}”</span>
                </p>
              </div>
            ))}
          </section>
        )}

        {fb && (
          <section className="stack" aria-labelledby="more-h">
            <h2 id="more-h" className="quiet-h" style={{ marginBottom: 8 }}>More detail, when you want it</h2>

            <details className="more">
              <summary>Your paragraph, sentence by sentence <span className="aside">{rows.length} sentence{rows.length === 1 ? "" : "s"}</span></summary>
              <div className="more-body">
                {fb.movesComment && <p className="body" data-dict="Feedback">{fb.movesComment}</p>}
                <div>
                  {rows.map((r, i) => {
                    const isWork = r.kind === "work" && fb.workOn;
                    const isUnsure = unsureText && (r.text === unsureText || r.text.includes(unsureText) || unsureText.includes(r.text));
                    return (
                      <div key={i} className="margin-row">
                        <span className="move-tag stack g4" style={{ alignItems: "flex-end" }}>
                          {moveLabel(r.move)}
                          {r.effect && <EffectDots effect={r.effect} />}
                        </span>
                        <div className="stack g10">
                          <p className="sentence" style={{ fontSize: 18 }} data-dict={session.topic}>
                            <span className={r.kind === "strength" ? "hl-strength" : isWork ? "mark-work" : undefined}>{r.text}</span>
                          </p>
                          {isUnsure && <span className="pill line" style={{ alignSelf: "flex-start" }}>You weren’t sure about this one</span>}
                        </div>
                        <div className="note">
                          {r.kind === "strength" && <span className="t">Went well</span>}
                          {isWork && fb.workOn && (
                            <>
                              <span className="t" style={{ color: "var(--amber-text)" }}>Rewrite this one · {fb.workOn.label}</span>
                              <span>{fb.workOn.comment}</span>
                            </>
                          )}
                          {!isWork && r.note && <span>{r.note}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {rows.length === 0 && <Marked text={session.text} marks={[]} />}
              </div>
            </details>

            {showLevels && (
              <details className="more">
                <summary>How well it works <span className="aside">Indicative levels</span></summary>
                <div className="more-body">
                  <Effectiveness fb={fb} sources={nSources} />
                </div>
              </details>
            )}

            {session.outline && session.outline.length > 0 && (
              <details className="more">
                <summary>Your plan and your paragraph</summary>
                <div className="more-body">
                  <PlanVsParagraph session={session} rows={rows} />
                </div>
              </details>
            )}

            {prev && (
              <details className="more">
                <summary>Same question: then and now</summary>
                <div className="more-body">
                  <div className="grid2" style={{ gap: 10, maxWidth: 480 }}>
                    <div className="stack g4">
                      <span className="small">{parseDay(prev.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                      <span className="num" style={{ fontSize: 22 }}>{prev.words} words</span>
                      {prevAreas !== null && <span className="small">{prevAreas} of 5 areas shown well</span>}
                    </div>
                    <div className="stack g4">
                      <span className="small" style={{ fontWeight: 600 }}>Today</span>
                      <span className="num" style={{ fontSize: 22 }}>{session.words} words</span>
                      {nowAreas !== null && <span className="small">{nowAreas} of 5 areas shown well</span>}
                    </div>
                  </div>
                </div>
              </details>
            )}

            {fb.modelParagraph && (
              <details className="more">
                <summary>Compare with a model paragraph {fb.workOn && !rewritten && <span className="aside">Try your rewrite first</span>}</summary>
                <div className="more-body">
                  <p className="paragraph" data-dict="Model paragraph">{fb.modelParagraph}</p>
                  <span className="small">A model, not the answer. Which sentence does something yours doesn’t? Select any useful word to add it to your dictionary.</span>
                </div>
              </details>
            )}
          </section>
        )}

        <div className="stack g16">
          <p className="small" style={{ fontSize: 14 }}>
            {session.words} words (aim {target.min}–{target.max}) · {mins}:{String(secs).padStart(2, "0")} writing time · {streak}-day streak
            {counts(session) ? (next ? ` · ${next.days - streak} to ${next.days}` : "") : " · 40+ words to count"}
          </p>
          <div className="row g20 wrap">
            <Link href="/" className={`btn${rewriteDone ? " big" : " secondary"}`}>Done for today</Link>
            <Link href="/progress" className="text-btn">See your progress</Link>
          </div>
        </div>
      </main>
    </SessionShell>
  );
}

function PlanVsParagraph({ session, rows }: { session: Session; rows: SentenceNote[] }) {
  const outline = session.outline ?? [];
  const n = Math.max(outline.length, rows.length);
  const matched = outline.filter((o, i) => rows[i]?.move === o.move).length;
  return (
    <section className="stack g12" aria-label="Your plan and your paragraph">
      <span className="small">{matched} of {outline.length} as planned</span>
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


const EFFECT_LABEL = { strong: "Does its job well", partial: "Partly does its job", weak: "Doesn’t yet do its job" } as const;

function EffectDots({ effect }: { effect: "strong" | "partial" | "weak" }) {
  const n = effect === "strong" ? 3 : effect === "partial" ? 2 : 1;
  return (
    <span className="dots" title={EFFECT_LABEL[effect]} aria-label={EFFECT_LABEL[effect]}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < n ? "on" : ""} style={i < n && effect === "weak" ? { background: "var(--chart-amber)" } : undefined} />
      ))}
    </span>
  );
}

const SCALE = BANDS.filter((b) => b !== "A2");

function BandScale({ band }: { band: Band }) {
  if (band === "n/a") return <span className="pill grey">Not tested</span>;
  const idx = SCALE.indexOf(band as (typeof SCALE)[number]);
  return (
    <span className="row g8" aria-label={`Indicative CEFR level ${band}`}>
      <span style={{ display: "inline-grid", gridTemplateColumns: `repeat(${SCALE.length}, 14px)`, gap: 2 }} aria-hidden="true">
        {SCALE.map((b, i) => (
          <span key={b} title={b} style={{ height: 8, borderRadius: 2, background: i <= idx ? "var(--chart-blue)" : "var(--line)" }} />
        ))}
      </span>
      <strong style={{ fontSize: 14, minWidth: 30 }}>{band === "A2" ? "A2" : band}</strong>
    </span>
  );
}

function Effectiveness({ fb, sources }: { fb: Feedback; sources: number }) {
  const rows = (fb.effectiveness ?? []).filter((c) => CRITERIA[c.criterion] && !(c.criterion === "synthesis" && sources < 2 && c.band === "n/a"));
  const order = (c: CriterionResult) => Object.keys(CRITERIA).indexOf(c.criterion);
  rows.sort((a, b) => order(a) - order(b));
  return (
    <section className="stack g16" aria-label="How well it works">
      <div className="stack g12">
        {fb.readerEffect && <p className="lead" style={{ color: "var(--ink)" }} data-dict="Feedback">{fb.readerEffect}</p>}
        <span className="small">
          Judged on effectiveness first: does the paragraph do its job for its reader? Language counts as far as it helps or blocks meaning.
          Levels are indicative, from one paragraph, aligned to the CEFR Companion Volume (2020).
        </span>
      </div>
      {rows.length > 0 && (
        <table className="table-view" style={{ fontSize: 14 }}>
          <caption className="sr-only">Effectiveness profile with indicative CEFR levels</caption>
          <thead>
            <tr>
              <th scope="col">Criterion</th>
              <th scope="col">Indicative level</th>
              <th scope="col">What this paragraph shows</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.criterion} style={CRITERIA[c.criterion].language ? { color: "var(--ink-3)" } : undefined}>
                <td style={{ verticalAlign: "top", width: 190 }}>
                  <strong style={{ color: "var(--ink)" }}>{CRITERIA[c.criterion].label}</strong>
                  <div className="small" style={{ fontSize: 11.5 }}>CEFR: {CRITERIA[c.criterion].cefr}</div>
                </td>
                <td style={{ verticalAlign: "top", width: 150 }}><BandScale band={c.band} /></td>
                <td style={{ verticalAlign: "top" }} data-dict="Feedback">{c.comment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
