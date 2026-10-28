"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { SessionShell } from "@/components/AppShell";
import { Bulb, Check, Close, Eye } from "@/components/Icons";
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
  ROWS,
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
    }
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
      promptText: synth ? `${prompt.text} ${synth}` : prompt.text,
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

  const taskHeader = (
    <header className="stack g10" style={{ textAlign: "center", alignItems: "center", maxWidth: 860, margin: "0 auto" }}>
      <span className={`eyebrow${mode === "hunt" ? " amber" : ""}`}>
        {label} · {prompt.topic}
      </span>
      <p className="prompt" style={{ fontSize: 28 }} data-dict="Writeathon task">{prompt.text}</p>
      {synth && <p className="lead" style={{ maxWidth: 760 }} data-dict="Writeathon task">{synth}</p>}
      <span className="small">
        One paragraph · {target.min}–{target.max} words · {Math.round(target.seconds / 60)} minutes
        {sources.length ? ` · ${sources.length} source${sources.length === 1 ? "" : "s"}` : " · no source: your own ideas"}
      </span>
    </header>
  );

  const sourcePicker = available.length > 0 && mode !== "hunt" && (
    <section className="card" aria-labelledby="nsrc-h" style={{ maxWidth: 860, margin: "0 auto", width: "100%", flexDirection: "row", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <div className="stack g4 grow">
        <h2 id="nsrc-h" className="h3">How many sources will you draw on?</h2>
        <span className="small">
          {available.length === 1
            ? "This topic has one source. Topics marked ‘up to 3 sources’ on Today let you practise synthesis."
            : "One source: respond to it. Two or three: synthesise them, showing how they agree, differ or build on each other. Each extra source adds about a minute."}
        </span>
      </div>
      <div className="row g8" role="radiogroup" aria-labelledby="nsrc-h">
        {[1, 2, 3].map((k) => (
          <button
            key={k}
            role="radio"
            aria-checked={sources.length === k}
            className="chip"
            aria-pressed={sources.length === k}
            disabled={k > available.length}
            title={k > available.length ? "Not available for this topic" : undefined}
            onClick={() => {
              setNSources(k);
              if (k > 1 && outline.length && !outline.some((o) => o.move === "synthesise")) {
                setOutline((o) => [...o.slice(0, Math.max(1, o.length - 1)), { move: "synthesise", note: "" }, ...o.slice(Math.max(1, o.length - 1))]);
              }
            }}
          >
            {k} source{k === 1 ? "" : "s"}
          </button>
        ))}
      </div>
    </section>
  );

  const sourcePane = (
    <aside className="stack g16" aria-label={sources.length > 1 ? "The sources" : "The source"}>
      {sources.length ? (
        <>
          <span className="eyebrow">{sources.length > 1 ? `Today’s ${sources.length} sources` : "Today’s source"}</span>
          <p className="small">
            {sources[0].own
              ? "Your own extract. Read it closely before you plan."
              : sources.length > 1
                ? "Short extracts from real, open-access research. Read them all, and notice where they agree or differ, before you plan."
                : `A short extract from real, open-access research${sources[0].journal ? ` in ${sources[0].journal}` : ""}. Read it first, then plan how you’ll use it.`}
          </p>
          {sources.map((s, i) => (
            <SourceCard key={s.cite + i} source={s} label={sources.length > 1 ? `Source ${i + 1}` : undefined} />
          ))}
        </>
      ) : (
        <div className="card flat">
          <span className="eyebrow">No source today</span>
          <p className="body" style={{ fontSize: 14 }}>Use your own ideas, knowledge and examples. There is nothing to cite.</p>
        </div>
      )}
      {repeat && <LastAttempt session={repeat} />}
    </aside>
  );

  /* ---------- Plan ---------- */
  if (stage === "plan") {
    return (
      <SessionShell step={0} label={label}>
        <main className="stack g24" style={{ padding: "28px 0 40px" }}>
          <div className="stack g16" style={{ padding: "0 32px" }}>
            {taskHeader}
            {sourcePicker}
          </div>
          <div className="desk" style={{ paddingTop: 0 }}>
            {sourcePane}

            <section className="panel stack g20" style={{ padding: 24 }} aria-labelledby="plan-h">
              <div className="row between wrap g8">
                <div className="stack g4">
                  <h1 id="plan-h" className="h3" style={{ fontSize: 18 }}>Plan your paragraph’s moves</h1>
                  <span className="small">What will each sentence do? Choose 3 to {maxMoves - (prompt.warmup ? 1 : 0)} moves in order. Add a few words for each if you like.</span>
                </div>
                <button className="btn secondary small" onClick={() => setOutline(suggestShape(prompt, TASK_SHAPES[prompt.task], sources.length).map((m) => ({ move: m, note: "" })))}>
                  Suggest a shape
                </button>
              </div>

              {outline.length === 0 ? (
                <div className="slot" style={{ minHeight: 64, justifyContent: "center" }}>Your outline is empty. Pick a move below to start.</div>
              ) : (
                <ol className="stack g8" style={{ margin: 0, padding: 0, listStyle: "none" }} aria-label="Your outline">
                  {outline.map((o, i) => (
                    <li key={i} className="move-row">
                      <span className="move-num">{i + 1}</span>
                      <div className="stack g4">
                        <strong style={{ fontSize: 15 }}>{MOVES[o.move].label}</strong>
                        <span className="small">{MOVES[o.move].does}</span>
                      </div>
                      <input
                        className="input"
                        style={{ minHeight: 40, fontSize: 15 }}
                        aria-label={`Note for move ${i + 1}, ${MOVES[o.move].label}`}
                        placeholder="A few words (optional)"
                        value={o.note}
                        onChange={(e) => setOutline((all) => all.map((x, k) => (k === i ? { ...x, note: e.target.value } : x)))}
                      />
                      <div className="row g4">
                        <button className="round-btn" style={{ width: 32, height: 32 }} onClick={() => moveStep(i, -1)} disabled={i === 0} aria-label={`Move ${MOVES[o.move].label} up`}>↑</button>
                        <button className="round-btn" style={{ width: 32, height: 32 }} onClick={() => moveStep(i, 1)} disabled={i === outline.length - 1} aria-label={`Move ${MOVES[o.move].label} down`}>↓</button>
                        <button className="round-btn" style={{ width: 32, height: 32 }} onClick={() => setOutline((all) => all.filter((_, k) => k !== i))} aria-label={`Remove ${MOVES[o.move].label}`}>
                          <Close size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              <div className="stack g12">
                <span className="label">Add a move{outline.length >= maxMoves ? " (outline full)" : ""}</span>
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
            </section>

            <aside className="stack g16 desk-right" aria-label="Suggestions for your plan">
              <section className="card" aria-live="polite">
                <span className="eyebrow">Suggestions for your plan</span>
                {outline.length === 0 ? (
                  <p className="body" style={{ fontSize: 14 }}>Add moves and you’ll see suggestions based on the task.</p>
                ) : (
                  <ul className="outline-list">
                    {checks.map((c) => (
                      <li key={c.text}>
                        <span className={`mark ${c.ok ? "done" : "todo"}`} aria-hidden="true">{c.ok ? <Check size={12} /> : <Bulb size={13} />}</span>
                        <span className="body" style={{ fontSize: 14 }}>
                          <span className="sr-only">{c.ok ? "Working well: " : "Suggestion: "}</span>
                          {c.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className="card amber">
                <span className="eyebrow amber">Today’s focus · {ROWS[focus.row].label}</span>
                <strong>{focus.label}</strong>
                <p className="body" style={{ fontSize: 14, color: "var(--ink-2)" }}>{focus.why}</p>
              </section>
              <button className="btn block" onClick={() => go("write")}>
                Start writing · {Math.round(target.seconds / 60)} minutes
              </button>
              <span className="small" style={{ textAlign: "center" }}>
                {outline.length === 0 ? "Planning is optional, but it usually helps." : "Suggestions only: your plan is your choice."}
              </span>
            </aside>
          </div>
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
    return (
      <SessionShell step={1} label={label}>
        <div className="desk">
          <aside className="stack g16" aria-label="Task and source">
            <section className="card">
              <span className="eyebrow">The task</span>
              <p className="body" style={{ fontSize: 15, color: "var(--ink)" }} data-dict="Writeathon task">{prompt.text}</p>
              {synth && <p className="body" style={{ fontSize: 14 }}>{synth}</p>}
            </section>
            {sources.map((s, i) => (
              <SourceCard key={s.cite + i} source={s} compact label={sources.length > 1 ? `Source ${i + 1}` : undefined} />
            ))}
          </aside>

          <section className="panel stack" style={{ minHeight: "calc(100dvh - 140px)", overflow: "hidden" }} aria-label="Your paragraph">
            <div className="row between" style={{ padding: "16px 24px", borderBottom: "1px solid var(--line)" }}>
              <span className={`timer${over ? " over" : ""}`} role="timer" aria-label={over ? "Time is up" : `${clock(left)} left`}>
                {over ? `+${clock(-left)}` : clock(left)}
              </span>
              <span className="small" aria-live="polite">
                {words} word{words === 1 ? "" : "s"} · aim for {target.min}–{target.max}
              </span>
            </div>
            <div className="meter" aria-hidden="true" style={{ borderRadius: 0 }}>
              <span style={{ width: `${pct}%`, background: words >= target.min ? "var(--chart-blue)" : "var(--chart-amber)" }} />
            </div>
            {over && <div className="notice" role="status" style={{ margin: "16px 24px 0" }}>Time’s up. Finish your sentence, then continue.</div>}
            <label htmlFor="editor" className="sr-only">Your paragraph</label>
            <textarea
              id="editor"
              className="editor"
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
            <div className="stack g10" style={{ padding: "0 24px 20px" }}>
              {pasteBlocked > 0 && <div className="notice">Pasting is switched off. This is practice, so the words need to be yours.</div>}
              {copiedLong && (
                <div className="notice">
                  You’ve copied “{copiedLong}” word for word from the source. Put it in your own words, or use quotation marks.
                </div>
              )}
              <div className="row between">
                <button className="text-btn" onClick={() => go("plan")}>← Back to plan</button>
                <button className="btn" disabled={words < 20} onClick={() => go("ask")}>
                  {words < 20 ? "Write at least 20 words" : "I’ve finished"}
                </button>
              </div>
            </div>
          </section>

          <aside className="stack g16 desk-right" aria-label="Writing coach">
            {sources.length > 0 && (
              <section className="card" aria-live="polite">
                <span className="eyebrow">{sources.length > 1 ? "Sources cited" : "Source cited"}</span>
                {sources.map((s, i) => {
                  const c = isCited(text, s);
                  return (
                    <span key={i} className="row g8 body" style={{ fontSize: 14, color: c ? "var(--ink)" : "var(--muted)" }}>
                      <span className={`mark ${c ? "done" : "todo"}`} aria-hidden="true" style={{ width: 20, height: 20 }}>{c ? <Check size={11} /> : ""}</span>
                      {s.cite}
                      <span className="sr-only">{c ? " cited" : " not cited yet"}</span>
                    </span>
                  );
                })}
                {sources.length > 1 && sources.every((s) => isCited(text, s)) && (
                  <span className="small">All cited. Now check you’ve shown how they relate, not just what each says.</span>
                )}
              </section>
            )}
            {outline.length > 0 && (
              <section className="card">
                <span className="eyebrow">Your outline</span>
                <ol className="outline-list">
                  {outline.map((o, i) => {
                    const status = i < writing ? "done" : i === writing ? "now" : "todo";
                    return (
                      <li key={i}>
                        <span className={`mark ${status}`} aria-hidden="true">{status === "done" ? <Check size={12} /> : i + 1}</span>
                        <div className="stack g4">
                          <strong style={{ fontSize: 14, color: status === "todo" ? "var(--muted)" : "var(--ink)" }}>
                            {MOVES[o.move].label}
                            <span className="sr-only"> ({status === "done" ? "written" : status === "now" ? "writing now" : "to come"})</span>
                          </strong>
                          {o.note && <span className="small">{o.note}</span>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
                {sentences.length > outline.length + 1 && (
                  <span className="small">You’ve written more sentences than you planned. That’s fine if each one does a job.</span>
                )}
              </section>
            )}

            {mode === "hunt" && huntItems ? (
              <section className="card amber" aria-label="Phrase Hunt targets">
                <span className="eyebrow amber">Five to find</span>
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
            ) : (
              <section className="card amber" aria-live="polite">
                <span className="eyebrow amber">Focus · {focus.label}</span>
                <p className="body" style={{ fontSize: 14, color: "var(--ink-2)" }}>
                  {signal.good && <Check size={12} color="var(--blue)" />} {signal.message}
                </p>
                <button className="text-btn row g6" style={{ fontSize: 13, color: "var(--amber-deep)" }} onClick={() => setPeek((v) => !v)} aria-expanded={peek}>
                  <Eye size={14} color="var(--amber-deep)" /> {peek ? "Hide" : "Show"} useful phrases
                </button>
                {peek && (
                  <div className="stack g4">
                    {focus.phrases.map((p) => (
                      <span key={p} className="serif" style={{ fontStyle: "italic", fontSize: 16 }}>{p}</span>
                    ))}
                  </div>
                )}
              </section>
            )}
          </aside>
        </div>
      </SessionShell>
    );
  }

  /* ---------- Ask ---------- */
  const options = REQUESTS.filter((r) => (!r.needsSource || sources.length > 0) && (!r.needsSources || sources.length >= r.needsSources));
  return (
    <SessionShell step={2} label={label}>
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
          <button className="btn" onClick={submit}>Get my feedback</button>
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
