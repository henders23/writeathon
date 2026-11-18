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
import { BANDS, CRITERIA, MOVES, REQUEST_LABEL, ROWS, targetFor, type Band, type MoveId } from "@/lib/content";
import { clearFeedbackError, requestFeedback } from "@/lib/feedbackRunner";
import { splitSentences } from "@/lib/match";
import { MILESTONES, counts, currentStreak } from "@/lib/progress";
import { patchSession, useAppState } from "@/lib/store";
import type { Carried, CriterionResult, Feedback, FollowUp, LanguageFocus, SentenceNote, Session } from "@/lib/types";

const moveLabel = (m: string) => MOVES[m as MoveId]?.label ?? m;

/** The paragraph's sentences with their moves, or a fallback built from the student's outline. */
function rowsFor(session: Session, fb: Feedback): SentenceNote[] {
  if (fb.sentences && fb.sentences.length) return fb.sentences;
  const sents = splitSentences(session.text);
  return sents.map((text, i) => {
    const work = fb.workOn && (text.includes(fb.workOn.said) || fb.workOn.said.includes(text));
    const strength = fb.strengths.some((s) => s.quote && text.includes(s.quote));
    const move = (session.outline?.[i]?.move ?? (i === 0 ? "claim" : i === sents.length - 1 ? "sowhat" : "explain")) as MoveId;
    return { text, move, kind: work ? ("work" as const) : strength ? ("strength" as const) : ("none" as const) };
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
  const unsureText = session.unsure !== undefined ? splitSentences(session.text)[session.unsure] : undefined;

  const rows = fb ? rowsFor(session, fb) : [];
  const workIsUnsure = Boolean(fb?.workOn && unsureText && (fb.workOn.said.includes(unsureText) || unsureText.includes(fb.workOn.said)));
  const rewriteDone = Boolean(fb) && (!fb?.workOn || Boolean(session.banked));
  const rewritten = Boolean(session.banked || session.rewrites?.some((r) => r.ok));
  const reading = fb?.reading ?? fb?.summary;
  const answers = fb?.requestAnswers ?? [];
  const levels = fb?.effectiveness ?? [];

  return (
    <SessionShell step={3}>
      <main className="container focus" style={{ maxWidth: 760 }}>
        <div className="stack g10">
          <p className="eyebrow">{session.warmup ? "Warm-up · " : ""}{session.topic}</p>
          <h1 className="h1">{fb ? "Your feedback" : session.feedbackError ? "Feedback didn’t arrive" : "Reading your paragraph…"}</h1>
        </div>

        {!fb && !session.feedbackError && (
          <div className="panel stack g12" role="status" style={{ padding: 48, alignItems: "center" }}>
            <div className="spinner" />
            <p className="body">Your tutor is reading your paragraph. This takes about 20 seconds.</p>
            <p className="paragraph">{session.text}</p>
          </div>
        )}

        {session.feedbackError && (
          <div className="stack g10">
            <div className="error" role="alert">{session.feedbackError}</div>
            <button className="btn secondary" style={{ alignSelf: "flex-start" }} onClick={() => { clearFeedbackError(session.id); void requestFeedback(session.id); }}>
              Try again
            </button>
          </div>
        )}

        {reading && (
          <section className="stack g6" aria-labelledby="read-h">
            <h2 id="read-h" className="quiet-h">What I understood</h2>
            <p className="lead" style={{ color: "var(--ink)" }}>{reading}</p>
            {fb?.reading && <p className="small">Is that what you meant to say? If not, the gap is the first thing to look at.</p>}
          </section>
        )}

        {fb?.followUp && session.carry && <FollowUpNote carry={session.carry} followUp={fb.followUp} />}

        {fb && answers.length > 0 && (
          <section className="stack g10" aria-labelledby="asked-h">
            <h2 id="asked-h" className="quiet-h">You asked</h2>
            {answers.map((a, i) => (
              <p key={i} className="body" style={{ fontSize: 16, color: "var(--ink-2)" }}>
                <strong style={{ color: "var(--ink)" }}>{REQUEST_LABEL[a.request] ?? a.request}{/[.?!]$/.test(a.request) ? "" : "."}</strong> {a.answer}
              </p>
            ))}
          </section>
        )}

        {fb && (fb.strengths.length > 0 || fb.transfer.length > 0) && (
          <section className="stack g10" aria-labelledby="well-h">
            <h2 id="well-h" className="quiet-h">What works, so you can do it again</h2>
            {fb.strengths.map((s, i) => (
              <div key={i} className="stack g4">
                {s.quote && <p className="sentence" style={{ fontSize: 18 }}><span className="hl-strength">{s.quote}</span></p>}
                <p className="body" style={{ fontSize: 16, color: "var(--ink-2)" }}>{s.comment}</p>
              </div>
            ))}
            {fb.transfer.map((t, i) => (
              <div key={`t${i}`} className="row g10" style={{ alignItems: "flex-start" }}>
                <span style={{ marginTop: 3, flexShrink: 0 }}><Check size={16} color="var(--blue)" /></span>
                <p className="body" style={{ fontSize: 16, color: "var(--ink-2)" }}>
                  <strong style={{ color: "var(--ink)" }}>You used it again: {t.label}.</strong> A pattern from your bank, used without being asked.
                  <span className="serif" style={{ fontStyle: "italic", display: "block", marginTop: 2 }}>“{t.quote}”</span>
                </p>
              </div>
            ))}
          </section>
        )}

        {fb?.workOn && (
          <section className="panel hero" aria-labelledby="rw-h">
            <h2 id="rw-h" className="eyebrow amber">One sentence to rewrite · {ROWS[fb.workOn.row]?.label} · {fb.workOn.label}</h2>
            <p className="sentence" style={{ fontSize: 22 }}>
              <span className={session.banked ? "hl-work" : "mark-work"}>{fb.workOn.said}</span>
            </p>
            {workIsUnsure && <span className="pill line" style={{ alignSelf: "flex-start" }}>You weren’t sure about this one</span>}
            <p className="body" style={{ fontSize: 16, color: "var(--ink)" }}>{fb.workOn.comment}</p>
            {fb.workOn.convention && (
              <p className="body" style={{ fontSize: 15, color: "var(--ink-2)" }}>
                <strong style={{ color: "var(--ink)" }}>Why readers expect this.</strong> {fb.workOn.convention}
              </p>
            )}
            <RewriteIt session={session} workOn={fb.workOn} />
          </section>
        )}

        {fb?.language && <LanguagePattern text={session.text} lang={fb.language} />}

        {fb?.carryForward && (
          <section className="stack g6" aria-labelledby="carry-h">
            <h2 id="carry-h" className="quiet-h">Take this into your next paragraph</h2>
            <p className="lead" style={{ color: "var(--ink)" }}>{fb.carryForward.strategy}</p>
            <NextStep session={session} />
          </section>
        )}

        {fb && (
          <section className="stack" aria-labelledby="more-h">
            <h2 id="more-h" className="quiet-h" style={{ marginBottom: 8 }}>More, when you want it</h2>

            <details className="more">
              <summary>Your paragraph, move by move <span className="aside">{rows.length} sentence{rows.length === 1 ? "" : "s"}</span></summary>
              <div className="more-body">
                <Moves session={session} rows={rows} unsureText={unsureText} />
              </div>
            </details>

            {levels.length > 0 && (
              <details className="more">
                <summary>Indicative levels <span className="aside">CEFR</span></summary>
                <div className="more-body">
                  <Effectiveness fb={fb} sources={nSources} />
                </div>
              </details>
            )}

            {fb.modelParagraph && (
              <details className="more">
                <summary>Compare with a model paragraph {fb.workOn && !rewritten && <span className="aside">Try your rewrite first</span>}</summary>
                <div className="more-body">
                  <p className="paragraph">{fb.modelParagraph}</p>
                  <span className="small">A model, not the answer. Which sentence does something yours doesn’t?</span>
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

const ACTED: Record<FollowUp["acted"], { label: string; pill: string }> = {
  yes: { label: "You did it", pill: "blue" },
  partly: { label: "Partly", pill: "amber" },
  no: { label: "Not yet", pill: "grey" },
};

/** Closes the loop: did the strategy from the last paragraph's feedback show up in this one? */
function FollowUpNote({ carry, followUp }: { carry: Carried; followUp: FollowUp }) {
  const a = ACTED[followUp.acted] ?? ACTED.partly;
  return (
    <section className="stack g6" aria-labelledby="follow-h">
      <h2 id="follow-h" className="quiet-h">Last time’s strategy</h2>
      <p className="body" style={{ fontSize: 15 }}>
        <span className={`pill ${a.pill}`} style={{ marginRight: 8 }}>{a.label}</span>
        {carry.own ? `You planned: “${carry.own}”` : carry.strategy}
      </p>
      <p className="body" style={{ fontSize: 16, color: "var(--ink-2)" }}>{followUp.comment}</p>
    </section>
  );
}

/** The student restates the strategy as their own plan; it comes back when they plan the next paragraph. */
function NextStep({ session }: { session: Session }) {
  const [draft, setDraft] = useState(session.nextStep ?? "");
  const saved = (session.nextStep ?? "") === draft.trim() && draft.trim().length > 0;
  return (
    <div className="field" style={{ marginTop: 6 }}>
      <label htmlFor="next-step">In your own words: what will you do in your next paragraph?</label>
      <span className="hint">One line is enough. You’ll see it again when you plan your next paragraph, and your next feedback will say whether it worked.</span>
      <textarea id="next-step" rows={2} maxLength={300} value={draft} onChange={(e) => setDraft(e.target.value)} />
      <div className="row g12" style={{ alignItems: "center" }}>
        <button
          className="btn secondary small"
          style={{ alignSelf: "flex-start" }}
          disabled={saved || (!draft.trim() && !session.nextStep)}
          onClick={() => patchSession(session.id, { nextStep: draft.trim() || undefined })}
        >
          {saved ? "Saved" : "Save my plan"}
        </button>
        {saved && <span className="small" role="status">It will be waiting for you next time.</span>}
      </div>
    </div>
  );
}

/** One language pattern: the places are marked; for rule-governed slips the student makes the correction. */
function LanguagePattern({ text, lang }: { text: string; lang: LanguageFocus }) {
  return (
    <section className="stack g10" aria-labelledby="lang-h">
      <h2 id="lang-h" className="quiet-h">One language pattern · {lang.label}</h2>
      <Marked text={text} marks={lang.quotes.map((q) => ({ quote: q, className: "mark-lang", label: lang.label }))} />
      <p className="body" style={{ fontSize: 16, color: "var(--ink-2)" }}>{lang.note}</p>
      {(lang.kind === "rule" || lang.more > 0 || lang.notMarked) && (
        <p className="small">
          {lang.kind === "rule" && "I have marked the places, not corrected them: the correcting is yours. "}
          {lang.more > 0 && `There ${lang.more === 1 ? "is one more" : `are ${lang.more} more`} like this for you to find. `}
          {lang.notMarked}
        </p>
      )}
    </section>
  );
}

/** The paragraph with the move each sentence performs, set against the student's plan. */
function Moves({ session, rows, unsureText }: { session: Session; rows: SentenceNote[]; unsureText?: string }) {
  const outline = session.outline ?? [];
  const matched = outline.filter((o, i) => rows[i]?.move === o.move).length;
  return (
    <div className="stack g12">
      <div>
        {rows.map((r, i) => {
          const planned = outline[i]?.move;
          const isUnsure = unsureText && (r.text === unsureText || r.text.includes(unsureText) || unsureText.includes(r.text));
          return (
            <div key={i} className="move-row">
              <span className="move-tag">{moveLabel(r.move)}</span>
              <div className="stack g4">
                <p className="sentence" style={{ fontSize: 18 }}>
                  <span className={r.kind === "strength" ? "hl-strength" : r.kind === "work" ? "mark-work" : undefined}>{r.text}</span>
                </p>
                {(isUnsure || (planned && planned !== r.move)) && (
                  <span className="small">
                    {planned && planned !== r.move ? `You planned: ${moveLabel(planned)}. ` : ""}
                    {isUnsure ? "You weren’t sure about this one." : ""}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {rows.length === 0 && <p className="paragraph">{session.text}</p>}
      {outline.length > 0 && (
        <span className="small">
          {matched} of {outline.length} moves as planned.{" "}
          {matched === outline.length && rows.length === outline.length
            ? "You wrote the paragraph you planned."
            : "Changing your plan while writing is fine. Ask: did each change make the paragraph stronger?"}
        </span>
      )}
    </div>
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
        <span className="small">
          One short paragraph is thin evidence, so read these as a rough guide and watch the trend on your progress page instead.
          Judged on how well the paragraph does its job for its reader; language counts as far as it helps or blocks meaning.
          Aligned to the CEFR Companion Volume (2020).
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
                <td style={{ verticalAlign: "top" }}>{c.comment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
