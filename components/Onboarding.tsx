"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getConfig } from "@/lib/api";
import { FIRST_FOCUS } from "@/lib/content";
import { dayKey } from "@/lib/dates";
import { DISCIPLINES } from "@/lib/disciplines";
import { saveProfile } from "@/lib/store";
import ThemeToggle from "./ThemeToggle";
import Welcome from "./Welcome";

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
        <Welcome onStart={() => setStep(1)} />
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

/** How feedback works: shown at the start, and from the profile page. */
export function HowFeedback({ standalone = false }: { standalone?: boolean }) {
  const steps = [
    { n: 1, t: "You choose what to ask about", d: "After writing, pick up to two things you want feedback on, and the sentence you’re least sure of." },
    { n: 2, t: "Your tutor says a few things well", d: "What it understood your paragraph to say, the answer to your question, one thing that works, and one sentence to rewrite, with the reason readers expect it." },
    { n: 3, t: "You rewrite one sentence", d: "You fix it yourself. Stuck? Ask for help in steps: a clue, then the pattern, then a version. Take only what you need." },
    { n: 4, t: "You carry one strategy forward", d: "Each feedback ends with one thing to try next time. It is waiting when you plan your next paragraph, and your next feedback says whether it worked." },
  ];
  return (
    <section className="stack g24" aria-labelledby="how-h">
      <div className="stack g10" style={{ maxWidth: 900 }}>
        <h1 id="how-h" className="h1">How you’ll get feedback</h1>
        <p className="lead">Feedback here works like a good tutor’s: focused on what matters most, plain about what to change, and always followed by you doing something with it.</p>
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
          <span className="body" style={{ color: "var(--blue-strong)" }}>Judge how well your writing works for its reader: your argument, your moves, how ideas connect, how you use and combine sources · answer what you asked about · quote your own words · explain why readers expect what they expect · point out one language pattern for you to fix</span>
        </div>
        <div className="card amber">
          <span className="eyebrow amber">What it won’t do</span>
          <span className="body" style={{ color: "var(--amber-deep)" }}>Rewrite your paragraph for you · comment on every sentence · mark every small language error · give you a grade (CEFR levels are indicative, to show growth)</span>
        </div>
      </div>
      {standalone && (
        <Link href="/" className="btn" style={{ alignSelf: "flex-start" }}>Back to Today</Link>
      )}
    </section>
  );
}
