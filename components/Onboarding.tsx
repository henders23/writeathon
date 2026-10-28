"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getConfig } from "@/lib/api";
import { FIRST_FOCUS } from "@/lib/content";
import { dayKey } from "@/lib/dates";
import { DISCIPLINES } from "@/lib/disciplines";
import { saveProfile } from "@/lib/store";
import ThemeToggle from "./ThemeToggle";

/** Two-step start: context and set-up, then how feedback works. */
export default function Onboarding() {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [name, setName] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [group, setGroup] = useState("");
  const [code, setCode] = useState("");
  const [needsCode, setNeedsCode] = useState(false);

  useEffect(() => {
    getConfig()
      .then((c) => setNeedsCode(c.accessCodeRequired))
      .catch(() => {});
  }, []);

  const ready = name.trim().length > 0 && discipline !== "" && (!needsCode || code.trim().length > 0);

  function finish() {
    saveProfile({
      name: name.trim(),
      discipline,
      group: group.trim() || "My seminar group",
      accessCode: code.trim() || undefined,
      createdAt: new Date().toISOString(),
      focus: { id: FIRST_FOCUS, since: dayKey() },
      frozenDates: [],
    });
  }

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">
          <span className="wordmark">Writeathon</span>
          <span className="byline">By Paul Hendrie</span>
        </span>
        <div className="topbar-right">
          {step > 0 && <span className="small">Getting started · {step} of 2</span>}
          <ThemeToggle />
        </div>
      </header>
      {step === 0 ? (
        <StartScreen onStart={() => setStep(1)} />
      ) : step === 1 ? (
        <main className="container narrow" style={{ paddingTop: 40, maxWidth: 560 }}>
          <form
            className="panel stack g20"
            style={{ padding: 32 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (ready) setStep(2);
            }}
          >
            <h2 className="h2">Let’s set you up</h2>
            <div className="field">
              <label htmlFor="name">Your first name</label>
              <input id="name" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="discipline">Your subject</label>
              <select id="discipline" value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
                <option value="" disabled>Choose your subject</option>
                {DISCIPLINES.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
              <span className="hint">Your topics come from this subject. You can change it later.</span>
            </div>
            <div className="field">
              <label htmlFor="group">Seminar group <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
              <input id="group" placeholder="e.g. Law EAP Group 2" value={group} onChange={(e) => setGroup(e.target.value)} />
            </div>
            {needsCode && (
              <div className="field">
                <label htmlFor="code">Access code</label>
                <input id="code" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} />
                <span className="hint">Your tutor will give you this.</span>
              </div>
            )}
            <div className="card tight blue">
              <strong style={{ color: "var(--blue-strong)" }}>Your first two tasks are short warm-ups</strong>
              <span className="body" style={{ fontSize: 14, color: "var(--blue)" }}>Everyday questions about studying, 60–100 words. No subject knowledge needed.</span>
            </div>
            <button className="btn block" type="submit" disabled={!ready}>Continue</button>
            <p className="small">Your progress is saved in this browser. Your writing is sent to an AI (Claude) to write your feedback. It’s practice, not assessment.</p>
          </form>
          <button className="text-btn" style={{ alignSelf: "center" }} onClick={() => setStep(0)}>← Back</button>
        </main>
      ) : (
        <main className="container">
          <HowFeedback />
          <div className="row between">
            <button className="text-btn" onClick={() => setStep(1)}>← Back</button>
            <button className="btn" onClick={finish}>Start my warm-up</button>
          </div>
        </main>
      )}
    </div>
  );
}

const STEPS = [
  { icon: "plan", label: "Plan", time: "2 min" },
  { icon: "write", label: "Write", time: "5 min" },
  { icon: "improve", label: "Improve", time: "3 min" },
] as const;

function StepIcon({ kind }: { kind: (typeof STEPS)[number]["icon"] }) {
  const common = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (kind === "plan")
    return (
      <svg {...common} stroke="var(--blue)">
        <path d="M11 6h9M11 12h9M12 18h8M4 16a2 2 0 1 1 4 0c0 .6-.5 1-1 1.5L4 20h4M6 10V4L4 6" />
      </svg>
    );
  if (kind === "write")
    return (
      <svg {...common} stroke="var(--blue)">
        <path d="M4 20h4L18.5 9.5a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4" />
      </svg>
    );
  return (
    <svg {...common} stroke="var(--amber)">
      <path d="M8 9h8M8 13h6M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 3v-3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h12z" />
    </svg>
  );
}

/** The first screen anyone sees: what Writeathon is, in as few words as possible. */
function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <main className="start" aria-labelledby="start-h">
      <h1 id="start-h" className="start-title">
        Ten minutes.
        <br />
        One paragraph.
        <br />
        Every day.
      </h1>
      <p className="lead" style={{ textAlign: "center" }}>Academic writing practice that makes you a stronger writer.</p>
      <ol className="start-steps" aria-label="Each session">
        {STEPS.map((s) => (
          <li key={s.label}>
            <StepIcon kind={s.icon} />
            <strong>{s.label}</strong>
            <span className="small">{s.time}</span>
          </li>
        ))}
      </ol>
      <button className="btn" style={{ minWidth: 180 }} onClick={onStart} autoFocus>
        Start <span aria-hidden="true">→</span>
      </button>
      <p className="small" style={{ textAlign: "center" }}>Real research · Feedback in the margins · Your progress, tracked</p>
    </main>
  );
}

/** How feedback works: shown at the start, and from the profile page. */
export function HowFeedback({ standalone = false }: { standalone?: boolean }) {
  const steps = [
    { n: 1, t: "You choose what to ask about", d: "After writing, pick up to two things you want feedback on, and the sentence you’re least sure of." },
    { n: 2, t: "Notes appear in the margin", d: "Each sentence is labelled with its move and how well it does its job. A profile shows how effective the whole paragraph is, with CEFR-aligned levels." },
    { n: 3, t: "You rewrite one sentence", d: "You fix it yourself. Stuck? Ask for help in steps: a clue, then the pattern, then a version. Take only what you need." },
    { n: 4, t: "You bank it, and it comes back", d: "Fixed sentences return for you to fix again from memory after 1, 3, 7, 14 and 30 days, until they’re yours." },
  ];
  return (
    <section className="stack g24" aria-labelledby="how-h">
      <div className="stack g10" style={{ maxWidth: 900 }}>
        <h1 id="how-h" className="h1">How you’ll get feedback</h1>
        <p className="lead">Feedback here works like a good tutor’s: focused on what matters most, written next to your sentences, and always followed by you doing something with it.</p>
      </div>
      <ol className="grid4" style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {steps.map((s) => (
          <li key={s.n} className="card" style={{ gap: 14 }}>
            <span className="move-num" style={{ width: 34, height: 34, borderRadius: 17 }}>{s.n}</span>
            <strong style={{ fontSize: 18 }}>{s.t}</strong>
            <span className="body" style={{ fontSize: 14 }}>{s.d}</span>
          </li>
        ))}
      </ol>
      <div className="grid2">
        <div className="card blue">
          <span className="eyebrow blue">What feedback will do</span>
          <span className="body" style={{ color: "var(--blue-strong)" }}>Judge how well your writing works for its reader: your argument, your moves, how ideas connect, how you use and combine sources · answer what you asked about · quote your own words · show a model paragraph to compare with</span>
        </div>
        <div className="card amber">
          <span className="eyebrow amber">What it won’t do</span>
          <span className="body" style={{ color: "var(--amber-deep)" }}>Rewrite your paragraph for you · mark every small language error · give you a grade (CEFR levels are indicative, to show growth)</span>
        </div>
      </div>
      {standalone && (
        <Link href="/" className="btn" style={{ alignSelf: "flex-start" }}>Back to Today</Link>
      )}
    </section>
  );
}
