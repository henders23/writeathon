"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import FrameLine from "@/components/FrameLine";
import { Close, Repeat } from "@/components/Icons";
import Loading from "@/components/Loading";
import Marked from "@/components/Marked";
import Onboarding from "@/components/Onboarding";
import { TASKS } from "@/lib/content";
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

  const header = (
    <div className="row between">
      <div className="row gap-8">
        <Repeat size={18} color="var(--blue)" />
        <span className="eyebrow blue">Revision day</span>
      </div>
      <Link href="/" className="icon-btn" aria-label="Close">
        <Close />
      </Link>
    </div>
  );

  if (!picked) {
    return (
      <main className="shell">
        <div className="page" style={{ gap: 18 }}>
          {header}
          <div className="stack gap-8">
            <h1 className="h1">Choose a paragraph to rework.</h1>
            <p className="body">
              Today you revise a whole paragraph, not one sentence. Change the ideas and the structure, not just the words. That&apos;s how
              experienced writers revise.
            </p>
          </div>
          {candidates.length === 0 && <p className="body">There are no paragraphs from the last week left to revise.</p>}
          <div className="stack gap-10">
            {candidates.map((s) => (
              <button key={s.id} className="card tight" style={{ textAlign: "left", cursor: "pointer", font: "inherit", color: "inherit" }} onClick={() => setPickedId(s.id)}>
                <span className="eyebrow">
                  {parseDay(s.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })} · {TASKS[s.task]?.label}
                </span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{s.topic}</span>
                <span className="small">{s.text.slice(0, 110)}…</span>
              </button>
            ))}
          </div>
        </div>
      </main>
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
      focusId: picked.focusId,
      plan: picked.plan,
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
    <main className="shell">
      <div className="page" style={{ gap: 18 }}>
        {header}
        {picked.frame && <FrameLine frame={picked.frame} />}
        <p className="body" style={{ fontSize: 16 }}>{picked.promptText}</p>

        <section className="card tight" aria-labelledby="orig">
          <h2 id="orig" className="eyebrow">Your original</h2>
          <Marked
            text={picked.text}
            marks={fb ? [...(fb.workOn ? [{ quote: fb.workOn.said, className: "mark-work", label: "Rewrite" }] : []), ...fb.strengths.map((s) => ({ quote: s.quote, className: "mark-strength", label: "Went well" }))] : []}
          />
          {fb?.summary && <p className="small">{fb.summary}</p>}
        </section>

        <section className="card tight" aria-labelledby="ask">
          <h2 id="ask" className="eyebrow" style={{ fontWeight: 600 }}>Ask yourself</h2>
          <ol className="moves">
            {CHECKLIST.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ol>
          <p className="small">The moves for this task: {TASKS[picked.task]?.moves.join(" → ")}</p>
        </section>

        <label htmlFor="revised" className="eyebrow" style={{ fontWeight: 600 }}>Your revised paragraph</label>
        <textarea
          id="revised"
          className="editor"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={(e) => e.preventDefault()}
          spellCheck={false}
        />
        <p className="small">{words} words</p>
        <button className="btn" disabled={!changed || words < 20} onClick={submit}>
          {changed ? "Submit revision" : "Make your changes, then submit"}
        </button>
        <button className="text-btn small" style={{ alignSelf: "flex-start", minHeight: 36 }} onClick={() => setPickedId(null)}>
          Choose a different paragraph
        </button>
      </div>
    </main>
  );
}
