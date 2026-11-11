"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { SessionShell } from "@/components/AppShell";
import { Check, Close, Eye } from "@/components/Icons";
import LastAttempt from "@/components/LastAttempt";
import Loading from "@/components/Loading";
import Onboarding from "@/components/Onboarding";
import SourceCard from "@/components/SourceCard";
import type { DailyPrompt } from "@/lib/bank/types";
import { focusSignal, outlineChecks, suggestShape } from "@/lib/coach";
import { availableSources, chosenSources, isCited, synthesisLine } from "@/lib/sources";
import {
  FOCUS_BY_ID,
  MOVES,
  MOVE_IDS,
  REQUESTS,
  TASKS,
  TASK_SHAPES,
  targetFor,
  type MoveId,
} from "@/lib/content";
import { dayKey } from "@/lib/dates";
import { requestFeedback } from "@/lib/feedbackRunner";
import { findPhrase, longestCopiedRun, splitSentences, wordCount } from "@/lib/match";
import { focusForDay, getTopic, lastAttempt } from "@/lib/progress";
import { newId, upsertSession, useAppState } from "@/lib/store";
import type { OutlineStep, Session } from "@/lib/types";

type Stage = "plan" | "write" | "ask";
const DRAFT_KEY = "writeathon.draft.v2";
const GROUPS = ["Open", "Develop", "Argue", "Close"] as const;
const MAX_MOVES = 6;

function clock(s: number) {
  const a = Math.abs(s);
  return `${Math.floor(a / 60)}:${String(a % 60).padStart(2, "0")}`;
}

function useTicker(running: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [running]);
  return now;
}

type Draft = { topic: string; mode: string; date: string; stage: Stage; outline: OutlineStep[]; text: string; writeSeconds?: number; nSources?: number };

function readDraft(): Draft | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function SessionFlow() {
  const state = useAppState();
  const router = useRouter();
  const params = useSearchParams();
  const topicId = params.get("topic") ?? "";
  const mode: Session["mode"] = params.get("mode") === "hunt" ? "hunt" : "write";
  const today = dayKey();

  const [stage, setStage] = useState<Stage>("plan");
  const [nSources, setNSources] = useState(() => Math.max(1, Math.min(3, Number(params.get("n")) || 1)));
  const [outline, setOutline] = useState<OutlineStep[]>([]);
  const [text, setText] = useState("");
  const [writeStart, setWriteStart] = useState(() => Date.now());
  const [writeSeconds, setWriteSeconds] = useState(0);
  const [deletions, setDeletions] = useState(0);
  const [pasteBlocked, setPasteBlocked] = useState(0);
  const [hints, setHints] = useState<number[]>([]);
  const [peek, setPeek] = useState(false);
  const [editMoves, setEditMoves] = useState(false);
  const [requests, setRequests] = useState<string[]>([]);
  const [requestNote, setRequestNote] = useState("");
  const [unsure, setUnsure] = useState<number | null>(null);
  const [startedAt] = useState(() => new Date().toISOString());
  const restored = useRef(false);
  const now = useTicker(stage === "write");

  const profile = state?.profile ?? null;
  const prompt: DailyPrompt | undefined = state && topicId ? getTopic(topicId, state) : undefined;
  const focusId = profile && prompt ? focusForDay(profile, prompt) : null;
  const cache = state?.huntCache;
  const huntItems = mode === "hunt" && cache && prompt && cache.date === today && cache.promptId === prompt.id ? cache.items : null;

  // Restore an unsent draft after an accidental refresh.
  useEffect(() => {
    if (restored.current || !prompt) return;
    restored.current = true;
    const d = readDraft();
    if (d && d.topic === prompt.id && d.mode === mode && d.date === today) {
      setOutline(d.outline);
      setText(d.text);
      setStage(d.stage);
      if (d.nSources) setNSources(d.nSources);
      if (d.stage === "write") setWriteStart(Date.now() - (d.writeSeconds ?? 0) * 1000);
      if (d.writeSeconds) setWriteSeconds(d.writeSeconds);
    } else {
      // Start from a suggested shape, so the plan is something to adjust rather than build from nothing.
      setOutline(suggestShape(prompt, TASK_SHAPES[prompt.task], chosenSources(prompt, nSources).length).map((m) => ({ move: m, note: "" })));
    }
    // nSources is read once, when the session opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, mode, today]);

  useEffect(() => {
    if (!prompt || !restored.current) return;
    try {
      const ws = stage === "write" ? Math.floor((Date.now() - writeStart) / 1000) : writeSeconds;
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ topic: prompt.id, mode, date: today, stage, outline, text, writeSeconds: ws, nSources }));
    } catch {
      /* storage blocked */
    }
  }, [prompt, mode, today, stage, outline, text, writeStart, writeSeconds, nSources]);

  useEffect(() => {
    if (mode === "hunt" && state?.profile && prompt && !huntItems) router.replace(`/hunt?topic=${encodeURIComponent(prompt.id)}`);
  }, [mode, state, prompt, huntItems, router]);

  const words = wordCount(text);
  const sentences = useMemo(() => splitSentences(text), [text]);
  const sources = useMemo(() => (prompt ? chosenSources(prompt, nSources) : []), [prompt, nSources]);
  const copied = useMemo(
    () => sources.map((s) => longestCopiedRun(text, s.text)).sort((a, b) => b.split(" ").length - a.split(" ").length)[0] ?? "",
    [text, sources],
  );
  const copiedLong = copied.split(" ").length >= 6 ? copied : "";

  if (!state) return <Loading />;
  if (!profile) return <Onboarding />;
  if (!prompt || !focusId) {
    return (
      <SessionShell step={0}>
        <main className="container narrow">
          <h1 className="h1">That topic isn’t available</h1>
          <p className="lead">It may have been a topic of your own that was saved in another browser.</p>
          <Link className="btn" href="/" style={{ alignSelf: "flex-start" }}>Choose a topic</Link>
        </main>
      </SessionShell>
    );
  }
  if (mode === "hunt" && !huntItems) return <Loading label="Getting your Phrase Hunt…" />;

  const focus = FOCUS_BY_ID[focusId];
  const task = TASKS[prompt.task];
  const available = availableSources(prompt);
  const target = targetFor(prompt.warmup, sources.length || 1);
  const synth = synthesisLine(sources);
  // Keep any word range written into the task in step with the target for the number of sources.
  const taskText = prompt.text.replace(/\(\d+–\d+ words\)/, `(${target.min}–${target.max} words)`);
  const maxMoves = MAX_MOVES + Math.max(0, sources.length - 1);
  const repeat = lastAttempt(state.sessions, prompt.id, today);
  const ids = outline.map((o) => o.move);
  const checks = outlineChecks(prompt, ids, sources);
  const label = mode === "hunt" ? "Phrase Hunt" : prompt.warmup ? "Warm-up" : task.label;

  function go(next: Stage) {
    if (next === "write" && stage !== "write") setWriteStart(Date.now() - writeSeconds * 1000);
    if (stage === "write" && next !== "write") setWriteSeconds(Math.floor((Date.now() - writeStart) / 1000));
    setStage(next);
    window.scrollTo({ top: 0 });
  }

  function addMove(m: MoveId) {
    if (outline.length >= maxMoves) return;
    setOutline((o) => [...o, { move: m, note: "" }]);
  }
  function moveStep(i: number, d: -1 | 1) {
    setOutline((o) => {
      const j = i + d;
      if (j < 0 || j >= o.length) return o;
      const next = [...o];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function submit() {
    if (!prompt || !focusId) return;
    const id = newId();
    const session: Session = {
      id,
      date: today,
      startedAt,
      mode,
      discipline: profile!.discipline,
      promptId: prompt.id,
      task: prompt.task,
      topic: prompt.topic,
      promptText: synth ? `${taskText} ${synth}` : taskText,
      frame: prompt.frame,
      source: prompt.source,
      sources: sources.length ? sources : undefined,
      warmup: prompt.warmup,
      focusId,
      plan: { claim: "", support: "", soWhat: "" },
      outline: outline.length ? outline : undefined,
      requests: requests.length ? requests : undefined,
      requestNote: requestNote.trim() || undefined,
      unsure: unsure ?? undefined,
      text: text.trim(),
      words,
      writeSeconds: writeSeconds || Math.floor((Date.now() - writeStart) / 1000),
      deletions,
      pasteBlocked,
      huntItems: huntItems ?? undefined,
      hintsUsed: mode === "hunt" ? hints : undefined,
    };
    upsertSession(session);
    try {
      window.sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    void requestFeedback(id);
    router.push(mode === "hunt" ? `/hunt/results/${id}` : `/feedback/${id}`);
  }

  const sourcePicker = available.length > 1 && mode !== "hunt" && (
    <div className="row g8 wrap" role="radiogroup" aria-label="How many sources will you draw on?">
      {available.slice(0, 3).map((_, i) => {
        const k = i + 1;
        return (
          <button
            key={k}
            role="radio"
            aria-checked={sources.length === k}
            className="chip"
            aria-pressed={sources.length === k}
            onClick={() => {
              setNSources(k);
              if (k > 1 && outline.length && !outline.some((o) => o.move === "synthesise")) {
                setOutline((o) => [...o.slice(0, Math.max(1, o.length - 1)), { move: "synthesise", note: "" }, ...o.slice(Math.max(1, o.length - 1))]);
              }
            }}
          >
            Use {k} source{k === 1 ? "" : "s"}
          </button>
        );
      })}
    </div>
  );

  /* ---------- Plan ---------- */
  if (stage === "plan") {
    const picking = editMoves || outline.length === 0;
    const tip = outline.length ? checks.find((c) => !c.ok) : undefined;
    return (
      <SessionShell step={0}>
        <main className="session-main">
          <header className="session-top stack g8">
            <span className={`eyebrow${mode === "hunt" ? " amber" : ""}`}>
              {label} · {prompt.topic}
            </span>
            <p className="prompt" style={{ maxWidth: 860 }} data-dict="Writeathon task">{taskText}</p>
            {synth && <p className="body" style={{ maxWidth: 760 }} data-dict="Writeathon task">{synth}</p>}
          </header>

          <aside className="stack g16" aria-label={sources.length > 1 ? "Your sources" : "Your source"}>
            {sources.length ? (
              <>
                <h2 className="quiet-h">
                  {sources[0].own ? "Read your extract first" : sources.length > 1 ? `Read your ${sources.length} sources first` : "Read the source first"}
                </h2>
                {sourcePicker}
                {sources.map((s, i) => (
                  <SourceCard key={s.cite + i} source={s} label={sources.length > 1 ? `Source ${i + 1}` : undefined} />
                ))}
                {sources.length > 1 && <p className="small">Use all {sources.length} in your paragraph. Notice where they agree or differ.</p>}
              </>
            ) : (
              <>
                <h2 className="quiet-h">No source today</h2>
                <p className="body">Use your own ideas, knowledge and examples. There is nothing to cite.</p>
              </>
            )}
            {repeat && <LastAttempt session={repeat} />}
          </aside>

          <section className="panel hero" aria-labelledby="plan-h">
            <div className="stack g6">
              <h1 id="plan-h" className="h2">What will each sentence do?</h1>
              <span className="small" style={{ fontSize: 14 }}>
                {outline.length
                  ? "A suggested shape for this task. Add a few words to each move if you like."
                  : "Your plan is empty. Choose moves below, or just start writing."}
              </span>
            </div>

            {outline.length > 0 && (
              <ol style={{ margin: 0, padding: 0, listStyle: "none" }} aria-label="Your outline">
                {outline.map((o, i) => (
                  <li key={i} className="plan-row">
                    <span className="n" aria-hidden="true">{i + 1}</span>
                    <div className="stack g4">
                      <strong style={{ fontSize: 15 }}>{MOVES[o.move].label}</strong>
                      <span className="small">{MOVES[o.move].does}</span>
                    </div>
                    <input
                      aria-label={`Note for move ${i + 1}, ${MOVES[o.move].label}`}
                      placeholder="A few words (optional)"
                      value={o.note}
                      onChange={(e) => setOutline((all) => all.map((x, k) => (k === i ? { ...x, note: e.target.value } : x)))}
                    />
                    <div className="row g4">
                      {editMoves && (
                        <>
                          <button className="round-btn" style={{ width: 36, height: 36 }} onClick={() => moveStep(i, -1)} disabled={i === 0} aria-label={`Move ${MOVES[o.move].label} up`}>↑</button>
                          <button className="round-btn" style={{ width: 36, height: 36 }} onClick={() => moveStep(i, 1)} disabled={i === outline.length - 1} aria-label={`Move ${MOVES[o.move].label} down`}>↓</button>
                          <button className="round-btn" style={{ width: 36, height: 36 }} onClick={() => setOutline((all) => all.filter((_, k) => k !== i))} aria-label={`Remove ${MOVES[o.move].label}`}>
                            <Close size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {outline.length > 0 && (
              <button className="text-btn" style={{ alignSelf: "flex-start", fontSize: 15, fontWeight: 600, minHeight: 44 }} aria-expanded={editMoves} onClick={() => setEditMoves((v) => !v)}>
                {editMoves ? "Done changing the moves" : "Change the moves"}
              </button>
            )}

            {picking && (
              <div className="stack g12">
                <div className="row between wrap g8">
                  <span className="label">Add a move{outline.length >= maxMoves ? " (outline full)" : ""}</span>
                  <button className="text-btn" onClick={() => setOutline(suggestShape(prompt, TASK_SHAPES[prompt.task], sources.length).map((m) => ({ move: m, note: "" })))}>
                    Back to the suggested shape
                  </button>
                </div>
                <div className="grid4" style={{ gap: 12 }}>
                  {GROUPS.map((g) => (
                    <div key={g} className="stack g6">
                      <span className="eyebrow">{g}</span>
                      {MOVE_IDS.filter((m) => MOVES[m].group === g).map((m) => (
                        <button key={m} className="move-btn" onClick={() => addMove(m)} disabled={outline.length >= maxMoves}>
                          <strong style={{ fontSize: 14 }}>{MOVES[m].label}</strong>
                          <span className="small" style={{ fontSize: 12 }}>{MOVES[m].does}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div aria-live="polite">
              {tip && <p className="hint-line">Suggestion: {tip.text}</p>}
            </div>

            <div className="row g20 wrap">
              <button className="btn big" onClick={() => go("write")}>
                Start writing · {Math.round(target.seconds / 60)} minutes
              </button>
              <span className="small" style={{ fontSize: 14 }}>
                {target.min}–{target.max} words · today’s focus: {focus.label.charAt(0).toLowerCase() + focus.label.slice(1)}
              </span>
            </div>
          </section>
        </main>
      </SessionShell>
    );
  }

  /* ---------- Write ---------- */
  if (stage === "write") {
    const elapsed = Math.floor((now - writeStart) / 1000);
    const left = target.seconds - elapsed;
    const over = left < 0;
    const pct = Math.min(100, (words / target.max) * 100);
    const signal = focusSignal(focusId, text, prompt);
    // Sentence i is taken to carry move i; the student's current sentence is the last one.
    const writing = Math.max(0, sentences.length - (/[.!?]["”’)]*\s*$/.test(text.trim()) ? 0 : 1));
    const nowMove = outline[writing];
    const nextMove = outline[writing + 1];
    const uncited = sources.filter((s) => !isCited(text, s));
    const citeNote = !sources.length
      ? ""
      : uncited.length
        ? ` · not cited yet: ${uncited.map((s) => s.cite).join(", ")}`
        : sources.length > 1
          ? " · all sources cited"
          : " · source cited";
    return (
      <SessionShell step={1}>
        <div className="session-main">
          <aside className="stack g20" aria-label="Task and source">
            <div className="stack g6">
              <h2 className="quiet-h">The task</h2>
              <p className="body" style={{ color: "var(--ink-2)" }} data-dict="Writeathon task">{taskText}</p>
              {synth && <p className="small" style={{ fontSize: 14 }}>{synth}</p>}
            </div>
            {sources.map((s, i) => (
              <SourceCard key={s.cite + i} source={s} compact label={sources.length > 1 ? `Source ${i + 1}` : undefined} />
            ))}
            {mode === "hunt" && huntItems && (
              <section className="stack g8" aria-label="Phrase Hunt targets">
                <h2 className="quiet-h">Five to find</h2>
                {huntItems.map((h, i) => {
                  const found = findPhrase(text, h.phrase);
                  const hinted = hints.includes(i);
                  return (
                    <div key={i} className={`slot${found ? " found" : hinted ? " hinted" : ""}`}>
                      {found && <Check size={14} color="var(--blue)" />}
                      <span className="grow">{found || hinted ? h.phrase : h.tag}</span>
                      {!found && !hinted && (
                        <button className="text-btn" style={{ fontSize: 13 }} onClick={() => setHints((x) => [...x, i])} aria-label={`Reveal item ${i + 1} (costs 1 point)`}>
                          Hint −1
                        </button>
                      )}
                    </div>
                  );
                })}
              </section>
            )}
            <button className="text-btn" style={{ alignSelf: "flex-start", minHeight: 44 }} onClick={() => go("plan")}>← Back to plan</button>
          </aside>

          <section className="panel stack" style={{ minHeight: "calc(100dvh - 160px)", overflow: "hidden" }} aria-label="Your paragraph">
            <div className="row between wrap g8" style={{ padding: "20px 32px 0" }}>
              <p className="body" aria-live="polite">
                {outline.length === 0 ? (
                  "Your paragraph"
                ) : nowMove ? (
                  <>
                    Now: <strong style={{ color: "var(--ink)" }}>{writing + 1} · {MOVES[nowMove.move].label}</strong>
                    {nowMove.note ? ` (${nowMove.note})` : ""}
                    <span style={{ color: "var(--muted)" }}>{nextMove ? ` · then ${MOVES[nextMove.move].label}` : " · your last move"}</span>
                  </>
                ) : (
                  "You’ve written every move you planned."
                )}
              </p>
              <span className={`timer${over ? " over" : ""}`} style={{ fontSize: 22 }} role="timer" aria-label={over ? "Time is up" : `${clock(left)} left`}>
                {over ? `+${clock(-left)}` : clock(left)}
              </span>
            </div>
            {over && <div className="notice" role="status" style={{ margin: "16px 32px 0" }}>Time’s up. Finish your sentence, then continue.</div>}
            <label htmlFor="editor" className="sr-only">Your paragraph</label>
            <textarea
              id="editor"
              className="editor"
              style={{ padding: "24px 32px" }}
              value={text}
              autoFocus
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="sentences"
              placeholder={outline[0] ? `Start with your ${MOVES[outline[0].move].label.toLowerCase()}…` : "Start with your main point…"}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" || e.key === "Delete") setDeletions((d) => d + 1);
              }}
              onPaste={(e) => {
                e.preventDefault();
                setPasteBlocked((p) => p + 1);
              }}
              onDrop={(e) => e.preventDefault()}
            />
            <div className="stack g16" style={{ padding: "0 32px 28px" }}>
              {pasteBlocked > 0 && <div className="notice">Pasting is switched off. This is practice, so the words need to be yours.</div>}
              {copiedLong && (
                <div className="notice">
                  You’ve copied “{copiedLong}” word for word from the source. Put it in your own words, or use quotation marks.
                </div>
              )}
              {mode !== "hunt" && (
                <div className="hint-line stack g6" aria-live="polite">
                  <span>
                    <strong>{focus.label}:</strong> {signal.message}{" "}
                    <button className="text-btn" style={{ fontSize: 14, color: "var(--amber-deep)" }} onClick={() => setPeek((v) => !v)} aria-expanded={peek}>
                      <Eye size={14} color="var(--amber-deep)" /> {peek ? "Hide" : "Show"} useful phrases
                    </button>
                  </span>
                  {peek && focus.phrases.map((p) => (
                    <span key={p} className="serif" style={{ fontStyle: "italic", fontSize: 16 }}>{p}</span>
                  ))}
                </div>
              )}
              <div className="row between wrap g16">
                <div className="stack g6" style={{ flex: "1 1 240px", maxWidth: 420 }}>
                  <span className="small" style={{ fontSize: 14 }} aria-live="polite">
                    {words} word{words === 1 ? "" : "s"} · aim for {target.min}–{target.max}{citeNote}
                  </span>
                  <div className="meter" aria-hidden="true" style={{ height: 4 }}>
                    <span style={{ width: `${pct}%`, background: "var(--chart-blue)" }} />
                  </div>
                </div>
                <button className="btn big" disabled={words < 20} onClick={() => go("ask")}>
                  {words < 20 ? "Write at least 20 words" : "I’ve finished"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </SessionShell>
    );
  }

  /* ---------- Ask ---------- */
  const options = REQUESTS.filter((r) => (!r.needsSource || sources.length > 0) && (!r.needsSources || sources.length >= r.needsSources));
  return (
    <SessionShell step={2}>
      <main className="container mid">
        <div className="stack g8">
          <h1 className="h1">What would you like feedback on?</h1>
          <p className="lead">Good writers ask for the feedback they need. Your tutor-in-the-margin will answer your questions first.</p>
        </div>

        <section className="panel stack g16" style={{ padding: 24 }} aria-labelledby="unsure-h">
          <div className="stack g4">
            <h2 id="unsure-h" className="h3">1 · Which sentence are you least sure about?</h2>
            <span className="small">Optional. Choose one and it will get a careful look.</span>
          </div>
          <div className="stack g8" role="radiogroup" aria-labelledby="unsure-h">
            {sentences.map((s, i) => (
              <button
                key={i}
                role="radio"
                aria-checked={unsure === i}
                className={`option${unsure === i ? " wrong" : ""}`}
                style={{ fontFamily: "var(--serif)", fontSize: 18 }}
                onClick={() => setUnsure(unsure === i ? null : i)}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        <section className="panel stack g16" style={{ padding: 24 }} aria-labelledby="ask-h">
          <div className="stack g4">
            <h2 id="ask-h" className="h3">2 · Choose up to two things to ask about</h2>
            <span className="small">{requests.length}/2 chosen</span>
          </div>
          <div className="row g8 wrap">
            {options.map((r) => {
              const on = requests.includes(r.id);
              return (
                <button
                  key={r.id}
                  className="chip"
                  aria-pressed={on}
                  disabled={!on && requests.length >= 2}
                  onClick={() => setRequests((x) => (on ? x.filter((y) => y !== r.id) : [...x, r.id]))}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
          <div className="field">
            <label htmlFor="note">Anything else? <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
            <input id="note" value={requestNote} maxLength={200} onChange={(e) => setRequestNote(e.target.value)} placeholder="e.g. Is ‘crucial’ too strong here?" />
          </div>
        </section>

        <div className="row between">
          <button className="text-btn" onClick={() => go("write")}>← Back to my paragraph</button>
          <button className="btn big" onClick={submit}>Get my feedback</button>
        </div>
      </main>
    </SessionShell>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SessionFlow />
    </Suspense>
  );
}
