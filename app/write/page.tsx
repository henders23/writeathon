"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Check, Close, Eye, Search } from "@/components/Icons";
import Loading from "@/components/Loading";
import Onboarding from "@/components/Onboarding";
import FrameLine from "@/components/FrameLine";
import LastAttempt from "@/components/LastAttempt";
import SourceCard from "@/components/SourceCard";
import Stepper from "@/components/Stepper";
import { FOCUS_BY_ID, PLAN_SECONDS, READ_SECONDS, ROWS, TARGET_WORDS, TASKS, WRITE_SECONDS } from "@/lib/content";
import { dayKey } from "@/lib/dates";
import { findPhrase, longestCopiedRun, wordCount } from "@/lib/match";
import { focusForDay, lastAttempt, todaysPrompt } from "@/lib/progress";
import { newId, upsertSession, useAppState } from "@/lib/store";
import type { Plan, Session } from "@/lib/types";

type Stage = "read" | "plan" | "write";
const DRAFT_KEY = "writeathon.draft";

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

function WriteSession() {
  const state = useAppState();
  const router = useRouter();
  const params = useSearchParams();
  const mode: Session["mode"] = params.get("mode") === "hunt" ? "hunt" : "write";
  const today = dayKey();

  const [stage, setStage] = useState<Stage>("read");
  const [stageStart, setStageStart] = useState(() => Date.now());
  const [plan, setPlan] = useState<Plan>({ claim: "", support: "", soWhat: "" });
  const [text, setText] = useState("");
  const [deletions, setDeletions] = useState(0);
  const [pasteBlocked, setPasteBlocked] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const [peek, setPeek] = useState(false);
  const [hints, setHints] = useState<number[]>([]);
  const [startedAt] = useState(() => new Date().toISOString());
  const restored = useRef(false);
  const now = useTicker(true);

  const profile = state?.profile ?? null;
  const prompt = profile ? todaysPrompt(profile, today) : null;
  const focusId = profile && prompt ? focusForDay(profile, prompt) : null;
  const cache = state?.huntCache;
  const huntItems = mode === "hunt" && cache && prompt && cache.date === today && cache.promptId === prompt.id ? cache.items : null;

  // Restore an unsent draft (e.g. after an accidental refresh).
  useEffect(() => {
    if (restored.current || !prompt) return;
    restored.current = true;
    try {
      const raw = window.sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as { date: string; promptId: string; mode: string; plan: Plan; text: string };
      if (d.date === today && d.promptId === prompt.id && d.mode === mode && d.text) {
        setPlan(d.plan);
        setText(d.text);
        setStage("write");
        setStageStart(Date.now());
      }
    } catch {
      /* no draft */
    }
  }, [prompt, today, mode]);

  useEffect(() => {
    if (!prompt || stage !== "write") return;
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ date: today, promptId: prompt.id, mode, plan, text }));
    } catch {
      /* storage blocked */
    }
  }, [text, plan, prompt, stage, today, mode]);

  useEffect(() => {
    if (mode === "hunt" && state?.profile && !huntItems) router.replace("/hunt");
  }, [mode, state, huntItems, router]);

  const words = wordCount(text);
  const copied = useMemo(() => (prompt?.source ? longestCopiedRun(text, prompt.source.text) : ""), [text, prompt]);
  const copiedLong = copied.split(" ").length >= 6 ? copied : "";

  if (!state) return <Loading />;
  if (!profile || !prompt || !focusId) return <Onboarding />;
  if (mode === "hunt" && !huntItems) return <Loading label="Getting your Phrase Hunt…" />;

  const focus = FOCUS_BY_ID[focusId];
  const task = TASKS[prompt.task];
  const repeat = lastAttempt(state.sessions, prompt.id, today);
  const elapsed = Math.floor((now - stageStart) / 1000);

  function go(next: Stage) {
    setStage(next);
    setStageStart(Date.now());
    window.scrollTo({ top: 0 });
  }

  function submit() {
    if (!prompt || !focusId || words < 20) return;
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
      promptText: prompt.text,
      frame: prompt.frame,
      source: prompt.source,
      focusId,
      plan,
      text: text.trim(),
      words,
      writeSeconds: elapsed,
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
    router.push(mode === "hunt" ? `/hunt/results/${id}` : `/feedback/${id}`);
  }

  const header = (
    <div className="row between">
      <div className="row gap-8">
        {mode === "hunt" && <Search color="var(--amber)" />}
        <span className={`eyebrow${mode === "hunt" ? " amber" : ""}`}>{mode === "hunt" ? "Phrase Hunt" : task.label}</span>
      </div>
      <Link href="/" className="icon-btn" aria-label="Leave this session">
        <Close />
      </Link>
    </div>
  );

  /* ---------- Read ---------- */
  if (stage === "read") {
    const left = READ_SECONDS - elapsed;
    return (
      <main className="shell">
        <div className="page" style={{ gap: 20 }}>
          {header}
          <Stepper current={0} />
          <div className="row between">
            <h1 className="h1" style={{ fontSize: 26 }}>Read</h1>
            <span className="small" aria-live="off">{left > 0 ? `About ${clock(left)}` : "Take your time"}</span>
          </div>
          {prompt.frame && <FrameLine frame={prompt.frame} />}
          <p className="prompt-text">{prompt.text}</p>
          {repeat && <LastAttempt session={repeat} />}
          {prompt.source && <SourceCard source={prompt.source} />}
          <section className="card tight" aria-labelledby="moves">
            <h2 id="moves" className="eyebrow" style={{ fontWeight: 600 }}>How a paragraph like this works</h2>
            <ol className="moves">
              {task.moves.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ol>
          </section>
          <section className="card amber tight" aria-label="Today's focus">
            <span className="eyebrow amber">Focus · {ROWS[focus.row].label}</span>
            <span style={{ fontSize: 16, fontWeight: 600 }}>{focus.label}</span>
            <p className="body" style={{ fontSize: 14, color: "var(--ink-2)" }}>{focus.why}</p>
          </section>
          <button className="btn" style={{ marginTop: "auto" }} onClick={() => go("plan")}>
            I&apos;m ready to plan
          </button>
        </div>
      </main>
    );
  }

  /* ---------- Plan ---------- */
  if (stage === "plan") {
    const left = PLAN_SECONDS - elapsed;
    return (
      <main className="shell">
        <div className="page" style={{ gap: 18 }}>
          {header}
          <Stepper current={1} />
          <div className="row between">
            <h1 className="h1" style={{ fontSize: 26 }}>Plan</h1>
            <span className="small">{left > 0 ? `About ${clock(left)}` : "Keep it quick"}</span>
          </div>
          <p className="body">Three quick notes. Words or phrases are fine.</p>
          <div className="field">
            <label htmlFor="claim">Your main point</label>
            <textarea id="claim" rows={2} value={plan.claim} onChange={(e) => setPlan({ ...plan, claim: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="support">Support: a reason, example or evidence</label>
            <textarea id="support" rows={2} value={plan.support} onChange={(e) => setPlan({ ...plan, support: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="sowhat">So what? Why it matters</label>
            <textarea id="sowhat" rows={2} value={plan.soWhat} onChange={(e) => setPlan({ ...plan, soWhat: e.target.value })} />
          </div>
          <details className="small">
            <summary style={{ cursor: "pointer", minHeight: 32 }}>See the question{prompt.source ? " and source" : ""} again</summary>
            <div className="stack gap-10" style={{ marginTop: 10 }}>
              <p className="body">{prompt.text}</p>
              {prompt.source && <SourceCard source={prompt.source} />}
            </div>
          </details>
          <div className="stack gap-10" style={{ marginTop: "auto" }}>
            <button className="btn" onClick={() => go("write")}>Start writing: 5 minutes</button>
            <button className="btn secondary" onClick={() => go("write")}>Skip the plan</button>
          </div>
        </div>
      </main>
    );
  }

  /* ---------- Write ---------- */
  const left = WRITE_SECONDS - elapsed;
  const over = left < 0;
  const pct = Math.min(100, (words / TARGET_WORDS.max) * 100);
  const planBits = [plan.claim, plan.support, plan.soWhat].filter((p) => p.trim());

  return (
    <main className="shell">
      <div className="page" style={{ gap: 16 }}>
        {header}
        <Stepper current={2} />
        <div className="row between">
          <span className={`timer${over ? " over" : ""}`} role="timer" aria-label={over ? "Time is up" : `${clock(left)} left`}>
            {over ? `+${clock(-left)}` : clock(left)}
          </span>
          <button className="btn secondary" style={{ width: "auto", minHeight: 44, padding: "0 16px", fontSize: 14 }} onClick={() => setShowPrompt((v) => !v)} aria-expanded={showPrompt}>
            {showPrompt ? "Hide question" : "Question"}
            {prompt.source ? " & source" : ""}
          </button>
        </div>
        {over && <div className="notice" role="status">Time&apos;s up. Finish your sentence, then submit.</div>}
        {showPrompt && (
          <div className="stack gap-10">
            <p className="body" style={{ fontSize: 16 }}>{prompt.text}</p>
            {prompt.source && <SourceCard source={prompt.source} />}
          </div>
        )}
        {!showPrompt && planBits.length > 0 && (
          <p className="small">
            <strong>Your plan:</strong> {planBits.join(" → ")}
          </p>
        )}

        {mode === "hunt" && huntItems && (
          <section className="stack gap-6" aria-label="Phrase Hunt targets">
            {huntItems.map((h, i) => {
              const found = findPhrase(text, h.phrase);
              const hinted = hints.includes(i);
              return (
                <div key={i} className={`slot${found ? " found" : hinted ? " hinted" : ""}`}>
                  {found && <Check size={14} color="var(--blue)" />}
                  <span className="grow">{found || hinted ? h.phrase : `${h.tag}`}</span>
                  {!found && !hinted && (
                    <button className="text-btn" style={{ fontSize: 13, minHeight: 32 }} onClick={() => setHints((x) => [...x, i])} aria-label={`Reveal item ${i + 1} (costs 1 point)`}>
                      Hint −1
                    </button>
                  )}
                </div>
              );
            })}
          </section>
        )}

        <label htmlFor="editor" className="sr-only">Your paragraph</label>
        <textarea
          id="editor"
          className="editor"
          value={text}
          autoFocus
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="sentences"
          placeholder="Start with your topic sentence…"
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

        <div className="stack gap-6">
          <div className="meter" aria-hidden="true">
            <span style={{ width: `${pct}%`, background: words >= TARGET_WORDS.min ? "var(--blue)" : "var(--amber)" }} />
            <i style={{ left: `${(TARGET_WORDS.min / TARGET_WORDS.max) * 100}%` }} />
          </div>
          <p className="small" aria-live="polite">
            {words} word{words === 1 ? "" : "s"} · aim for {TARGET_WORDS.min}–{TARGET_WORDS.max}
          </p>
        </div>

        {pasteBlocked > 0 && <div className="notice">Pasting is switched off. This is practice, so the words need to be yours.</div>}
        {copiedLong && (
          <div className="notice">
            You&apos;ve copied “{copiedLong}” word for word from the source. Try putting it your own way, or use quotation marks.
          </div>
        )}

        {mode === "write" && (
          <div className="stack gap-6">
            <button className="text-btn row gap-6" style={{ fontSize: 14, minHeight: 36, color: "var(--amber-deep)" }} onClick={() => setPeek((v) => !v)} aria-expanded={peek}>
              <Eye color="var(--amber-deep)" /> {peek ? "Hide" : "Peek at"} focus examples: {focus.label.toLowerCase()}
            </button>
            {peek && (
              <div className="stack gap-2">
                {focus.phrases.map((p) => (
                  <span key={p} className="serif" style={{ fontStyle: "italic", fontSize: 16 }}>{p}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <button className="btn" style={{ marginTop: "auto" }} disabled={words < 20} onClick={submit}>
          {words < 20 ? "Write at least 20 words to submit" : "Submit paragraph"}
        </button>
      </div>
    </main>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={<Loading />}>
      <WriteSession />
    </Suspense>
  );
}
