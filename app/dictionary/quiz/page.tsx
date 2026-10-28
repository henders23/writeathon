"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { Check } from "@/components/Icons";
import Loading from "@/components/Loading";
import Onboarding from "@/components/Onboarding";
import { postJSON } from "@/lib/api";
import { dayKey } from "@/lib/dates";
import { dictDue, scheduleDict } from "@/lib/progress";
import { updateDictEntry, useAppState } from "@/lib/store";
import type { DictEntry, QuizType } from "@/lib/types";

const QUIZ_SIZE = 10;
const TYPE_LABEL: Record<QuizType, string> = { meaning: "Choose the meaning", gap: "Fill the gap", recall: "Recall the word", use: "Use it" };

function shuffle<T>(xs: T[], seed: string): T[] {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) | 0;
    const j = Math.abs(h) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Matches the word and simple inflections (analyse → analysed, analyses). */
function wordRegex(word: string) {
  const stem = word.length > 5 ? word.slice(0, -1) : word;
  return new RegExp(`\\b${esc(stem)}[a-z]{0,3}\\b`, "i");
}
function gapped(sentence: string, word: string): string | null {
  const re = wordRegex(word);
  return re.test(sentence) ? sentence.replace(re, "_____") : null;
}

function quizTypeFor(e: DictEntry): QuizType {
  const order: QuizType[] = ["meaning", "gap", "recall", "use"];
  let t = order[Math.min(e.step, 3)];
  if (t === "gap" && !gapped(e.example, e.word) && !gapped(e.context, e.word)) t = "meaning";
  if (t === "meaning" && e.distractors.length === 0) t = "recall";
  return t;
}

function close(a: string, b: string) {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  if (x === y) return true;
  if (Math.abs(x.length - y.length) > 1 || y.length < 6) return false;
  let diff = 0;
  for (let i = 0, j = 0; i < x.length || j < y.length; ) {
    if (x[i] === y[j]) { i++; j++; continue; }
    if (++diff > 1) return false;
    if (x.length > y.length) i++;
    else if (y.length > x.length) j++;
    else { i++; j++; }
  }
  return true;
}

function Quiz() {
  const state = useAppState();
  const params = useSearchParams();
  const practice = params.get("practice") === "1";
  const today = dayKey();
  const [ids] = useState<string[] | null>(() => null);
  const [queue, setQueue] = useState<string[] | null>(ids);
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState<{ ok: boolean; comment?: string; picked?: string } | null>(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  // Fix the question set when the page opens, so answering doesn't reshuffle it.
  if (state && state.profile && queue === null) {
    const pool = practice ? shuffle(state.dictionary, today).slice(0, QUIZ_SIZE) : dictDue(state.dictionary, today).slice(0, QUIZ_SIZE);
    setQueue(pool.map((e) => e.id));
  }

  const entry = state && queue ? state.dictionary.find((e) => e.id === queue[i]) : undefined;
  const type = entry ? quizTypeFor(entry) : "meaning";
  const options = useMemo(() => {
    if (!entry) return [];
    if (type === "meaning") return shuffle([entry.definition, ...entry.distractors.slice(0, 3)], entry.id + i);
    if (type === "gap") return shuffle([entry.word, ...entry.wrongWords.slice(0, 3)], entry.id + i);
    return [];
  }, [entry, type, i]);

  if (!state || queue === null) return <Loading />;
  if (!state.profile) return <Onboarding />;

  if (queue.length === 0) {
    return (
      <AppShell>
        <main className="container narrow">
          <h1 className="h1">No words due</h1>
          <p className="lead">{state.dictionary.length ? "You’re up to date. Come back tomorrow, or practise anyway." : "Add words to your dictionary first: select any word in a source or your feedback."}</p>
          <div className="row g12">
            {state.dictionary.length > 0 && <Link className="btn" href="/dictionary/quiz?practice=1" onClick={() => setQueue(null)}>Practise anyway</Link>}
            <Link className="btn secondary" href="/dictionary">Your dictionary</Link>
          </div>
        </main>
      </AppShell>
    );
  }

  if (i >= queue.length || !entry) {
    return (
      <AppShell>
        <main className="container narrow">
          <p className="eyebrow">{practice ? "Extra practice" : "Quiz complete"}</p>
          <h1 className="h1">{score} of {queue.length} right</h1>
          <p className="lead">
            {practice
              ? "Extra practice doesn’t change when words come back."
              : "Words you got right come back after a longer gap. The others come back tomorrow."}
          </p>
          <div className="row g12">
            <Link className="btn" href="/">Back to Today</Link>
            <Link className="btn secondary" href="/dictionary">Your dictionary</Link>
          </div>
        </main>
      </AppShell>
    );
  }

  function record(ok: boolean, comment?: string, picked?: string) {
    if (!entry) return;
    setAnswer({ ok, comment, picked });
    if (ok) setScore((s) => s + 1);
    if (!practice) updateDictEntry(scheduleDict(entry, ok, type, today));
  }

  async function checkUse() {
    if (!entry) return;
    if (!wordRegex(entry.word).test(typed)) {
      setErr(`Use “${entry.word}” in your sentence.`);
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const v = await postJSON<{ ok: boolean; comment: string }>("/api/use-check", { word: entry.word, definition: entry.definition, sentence: typed });
      record(v.ok, v.comment);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't check that just now.");
    }
    setBusy(false);
  }

  function next() {
    setAnswer(null);
    setTyped("");
    setErr(null);
    setI((x) => x + 1);
  }

  const gapText = gapped(entry.example, entry.word) ?? gapped(entry.context, entry.word);

  return (
    <AppShell>
      <main className="container narrow">
        <div className="stack g8">
          <div className="row between">
            <span className="eyebrow">{practice ? "Extra practice" : "Dictionary quiz"} · {i + 1} of {queue.length}</span>
            <span className="small">{TYPE_LABEL[type]}</span>
          </div>
          <div className="meter" aria-hidden="true">
            <span style={{ width: `${(i / queue.length) * 100}%`, background: "var(--chart-blue)" }} />
          </div>
        </div>

        <section className="panel stack g20" style={{ padding: 32 }} aria-live="polite">
          {type === "meaning" && (
            <>
              <div className="stack g6">
                <span className="small">What does this word mean?</span>
                <span className="serif" style={{ fontSize: 40 }}>{entry.word}</span>
                {entry.context && entry.context !== entry.word && <span className="small" style={{ color: "var(--ink-3)" }}>As in: “{entry.context}”</span>}
              </div>
              <div className="stack g8">
                {options.map((o) => (
                  <button
                    key={o}
                    className={`option${answer ? (o === entry.definition ? " right" : o === answer.picked ? " wrong" : "") : ""}`}
                    disabled={Boolean(answer)}
                    onClick={() => record(o === entry.definition, undefined, o)}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </>
          )}

          {type === "gap" && gapText && (
            <>
              <div className="stack g6">
                <span className="small">Which word completes the sentence?</span>
                <p className="serif" style={{ margin: 0, fontSize: 24, lineHeight: 1.45 }}>{gapText}</p>
              </div>
              <div className="grid2">
                {options.map((o) => (
                  <button
                    key={o}
                    className={`option${answer ? (o === entry.word ? " right" : o === answer.picked ? " wrong" : "") : ""}`}
                    style={{ fontFamily: "var(--serif)", fontSize: 19 }}
                    disabled={Boolean(answer)}
                    onClick={() => record(o === entry.word, undefined, o)}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </>
          )}

          {type === "recall" && (
            <form className="stack g16" onSubmit={(e) => { e.preventDefault(); if (!answer && typed.trim()) record(close(typed, entry.word)); }}>
              <div className="stack g6">
                <span className="small">Which word means…</span>
                <p className="serif" style={{ margin: 0, fontSize: 24, lineHeight: 1.4 }}>{entry.definition}</p>
                {gapText && <span className="small" style={{ color: "var(--ink-3)" }}>“{gapText}”</span>}
              </div>
              <div className="field">
                <label htmlFor="recall">The word <span style={{ fontWeight: 400, color: "var(--muted)" }}>(starts with “{entry.word[0]}”, {entry.word.length} letters)</span></label>
                <input id="recall" autoComplete="off" autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} disabled={Boolean(answer)} style={{ fontFamily: "var(--serif)", fontSize: 22 }} />
              </div>
              {!answer && <button className="btn" type="submit" disabled={!typed.trim()} style={{ alignSelf: "flex-start" }}>Check</button>}
            </form>
          )}

          {type === "use" && (
            <div className="stack g16">
              <div className="stack g6">
                <span className="small">Write your own academic sentence using</span>
                <span className="serif" style={{ fontSize: 36 }}>{entry.word}</span>
                <span className="body">{entry.definition}</span>
                {entry.collocations.length > 0 && <span className="small">Often used with: {entry.collocations.join(" · ")}</span>}
              </div>
              <div className="field">
                <label htmlFor="use">Your sentence</label>
                <textarea id="use" rows={3} value={typed} onChange={(e) => setTyped(e.target.value)} onPaste={(e) => e.preventDefault()} disabled={Boolean(answer)} style={{ fontFamily: "var(--serif)", fontSize: 19 }} />
              </div>
              {!answer && (
                <div className="row g12">
                  <button className="btn" onClick={checkUse} disabled={busy || typed.trim().split(/\s+/).length < 5}>{busy ? "Checking…" : "Check my sentence"}</button>
                  <button className="text-btn" onClick={() => record(false, "Skipped. It will come back tomorrow.")}>Skip</button>
                </div>
              )}
            </div>
          )}

          {err && <div className="error" role="alert">{err}</div>}

          {answer && (
            <div className={`card tight ${answer.ok ? "blue" : "amber"}`}>
              <strong style={{ color: answer.ok ? "var(--blue-strong)" : "var(--amber-deep)" }}>
                {answer.ok ? <><Check size={13} /> Right</> : type === "gap" || type === "recall" ? `It’s “${entry.word}”` : "Not quite"}
              </strong>
              {answer.comment && <span className="body" style={{ fontSize: 14 }}>{answer.comment}</span>}
              <span className="body" style={{ fontSize: 14 }}><strong>{entry.word}</strong> ({entry.partOfSpeech}): {entry.definition}</span>
              {entry.example && <span className="serif" style={{ fontStyle: "italic", fontSize: 16 }}>“{entry.example}”</span>}
            </div>
          )}
          {answer && <button className="btn" style={{ alignSelf: "flex-start" }} onClick={next} autoFocus>{i + 1 < queue.length ? "Next word" : "See results"}</button>}
        </section>
      </main>
    </AppShell>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Quiz />
    </Suspense>
  );
}
