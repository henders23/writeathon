"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { Repeat } from "@/components/Icons";
import Loading from "@/components/Loading";
import Marked from "@/components/Marked";
import Onboarding from "@/components/Onboarding";
import SourceCard from "@/components/SourceCard";
import { MOVES, TASKS } from "@/lib/content";
import { dayKey, parseDay } from "@/lib/dates";
import { wordCount } from "@/lib/match";
import { revisionCandidates } from "@/lib/progress";
import { newId, upsertSession, useAppState } from "@/lib/store";
import type { Session } from "@/lib/types";

const CHECKLIST = [
  "Does your first sentence answer the question directly?",
  "Is one of the moves missing? Add it.",
  "Is there a sentence that doesn't serve your point? Cut it.",
  "Would a different order make the argument clearer?",
  "Does the last sentence say why it matters to this reader?",
];

/** Weekly revision day: rework a whole paragraph from this week (ideas and structure, not just words). */
export default function RevisePage() {
  const state = useAppState();
  const router = useRouter();
  const today = dayKey();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [startedAt, setStartedAt] = useState(() => Date.now());

  const candidates = state ? revisionCandidates(state.sessions, today) : [];
  const picked = candidates.find((s) => s.id === pickedId) ?? null;

  useEffect(() => {
    if (picked) {
      setText(picked.text);
      setStartedAt(Date.now());
    }
  }, [picked]);

  if (!state) return <Loading />;
  if (!state.profile) return <Onboarding />;

  const eyebrow = (
    <span className="row g8">
      <Repeat size={18} color="var(--blue)" />
      <span className="eyebrow blue">Revision day</span>
    </span>
  );

  if (!picked) {
    return (
      <AppShell>
        <main className="container">
          <div className="stack g8" style={{ maxWidth: 820 }}>
            {eyebrow}
            <h1 className="h1">Choose a paragraph to rework.</h1>
            <p className="lead">
              Today you revise a whole paragraph, not one sentence. Change the ideas and the structure, not just the words. That’s how
              experienced writers revise.
            </p>
          </div>
          {candidates.length === 0 && <div className="card flat" style={{ maxWidth: 820 }}><p className="body">There are no paragraphs from the last week left to revise.</p></div>}
          <div className="grid3">
            {candidates.map((s) => (
              <button key={s.id} className="topic" style={{ textAlign: "left", cursor: "pointer", font: "inherit", color: "inherit" }} onClick={() => setPickedId(s.id)}>
                <span className="eyebrow">
                  {parseDay(s.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })} · {TASKS[s.task]?.label}
                </span>
                <span className="h3">{s.topic}</span>
                <span className="body" style={{ fontSize: 14, fontFamily: "var(--serif)" }}>{s.text.slice(0, 160)}…</span>
                <span className="small">{s.words} words{s.feedback?.workOn ? ` · last time: ${s.feedback.workOn.label.toLowerCase()}` : ""}</span>
              </button>
            ))}
          </div>
        </main>
      </AppShell>
    );
  }

  const words = wordCount(text);
  const changed = text.trim() !== picked.text.trim();
  const fb = picked.feedback;

  function submit() {
    if (!picked || !changed) return;
    const id = newId();
    const session: Session = {
      id,
      date: today,
      startedAt: new Date().toISOString(),
      mode: "revise",
      discipline: picked.discipline,
      promptId: picked.promptId,
      task: picked.task,
      topic: picked.topic,
      promptText: picked.promptText,
      frame: picked.frame,
      source: picked.source,
      warmup: picked.warmup,
      focusId: picked.focusId,
      plan: picked.plan,
      outline: picked.outline,
      text: text.trim(),
      words,
      writeSeconds: Math.round((Date.now() - startedAt) / 1000),
      deletions: 0,
      pasteBlocked: 0,
      revisionOf: picked.id,
    };
    upsertSession(session);
    router.push(`/revise/${id}`);
  }

  return (
    <AppShell>
      <main className="container">
        <div className="stack g8" style={{ maxWidth: 900 }}>
          {eyebrow}
          <p className="prompt" data-dict="Writeathon task">{picked.promptText}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "360px minmax(0, 1fr)", gap: 24, alignItems: "start" }}>
          <aside className="stack g16">
            <section className="card" aria-labelledby="orig">
              <h2 id="orig" className="eyebrow">Your original</h2>
              <Marked
                text={picked.text}
                marks={fb ? [...(fb.workOn ? [{ quote: fb.workOn.said, className: "mark-work", label: "Rewrite" }] : []), ...fb.strengths.map((s) => ({ quote: s.quote, className: "mark-strength", label: "Went well" }))] : []}
              />
              {fb?.summary && <p className="small">{fb.summary}</p>}
            </section>
            <section className="card flat" aria-labelledby="ask">
              <h2 id="ask" className="eyebrow">Ask yourself</h2>
              <ol className="stack g8" style={{ margin: 0, paddingLeft: 20 }}>
                {CHECKLIST.map((c) => (
                  <li key={c} className="body" style={{ fontSize: 14 }}>{c}</li>
                ))}
              </ol>
              <p className="small">
                {picked.outline?.length
                  ? `Your plan was: ${picked.outline.map((o) => MOVES[o.move].label).join(" → ")}`
                  : `The moves for this task: ${TASKS[picked.task]?.moves.join(" → ")}`}
              </p>
            </section>
            {picked.source && <SourceCard source={picked.source} compact />}
          </aside>

          <section className="panel stack" style={{ overflow: "hidden" }}>
            <div className="row between" style={{ padding: "16px 24px", borderBottom: "1px solid var(--line)" }}>
              <label htmlFor="revised" className="h3">Your revised paragraph</label>
              <span className="small">{words} words</span>
            </div>
            <textarea
              id="revised"
              className="editor"
              style={{ minHeight: 420 }}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              spellCheck={false}
            />
            <div className="row between" style={{ padding: "0 24px 20px" }}>
              <button className="text-btn" onClick={() => setPickedId(null)}>Choose a different paragraph</button>
              <button className="btn" disabled={!changed || words < 20} onClick={submit}>
                {changed ? "Submit revision" : "Make your changes, then submit"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
