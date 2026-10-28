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
  const [step, setStep] = useState<1 | 2>(1);
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
        <span className="wordmark">Writeathon</span>
        <div className="topbar-right">
          <span className="small">Getting started · {step} of 2</span>
          <ThemeToggle />
        </div>
      </header>
      {step === 1 ? (
        <main className="container" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 1fr)", gap: 40, paddingTop: 48 }}>
          <section className="stack g24" aria-labelledby="welcome-h">
            <div className="stack g14">
              <h1 id="welcome-h" className="h1 xl">Ten minutes a day to become a confident academic writer.</h1>
              <p className="lead" style={{ maxWidth: 620 }}>
                Each day you write one short paragraph on a topic from your subject. You plan it, write it, ask for the feedback you want,
                and rewrite one sentence. Small, regular practice builds skill faster than occasional long essays.
              </p>
            </div>
            <div className="stack g12">
              <h2 className="eyebrow">A session takes about ten minutes</h2>
              <div className="timeline" role="img" aria-label="Session timeline: plan 2 minutes, write 5 minutes, feedback and rewrite 3 minutes">
                <div><span style={{ background: "var(--chart-blue-light)" }} /><strong style={{ fontSize: 14 }}>Choose</strong><span className="small">30 s</span></div>
                <div><span style={{ background: "var(--chart-blue-light)" }} /><strong style={{ fontSize: 14 }}>Plan</strong><span className="small">1–2 min</span></div>
                <div><span style={{ background: "var(--blue)" }} /><strong style={{ fontSize: 14 }}>Write one paragraph</strong><span className="small">5 min</span></div>
                <div><span style={{ background: "var(--amber)" }} /><strong style={{ fontSize: 14 }}>Feedback &amp; rewrite</strong><span className="small">3 min</span></div>
              </div>
            </div>
            <div className="grid3">
              <div className="card tight">
                <strong>Real sources</strong>
                <span className="body" style={{ fontSize: 14 }}>Short extracts from genuine open-access research in your subject, or a source of your own.</span>
              </div>
              <div className="card tight">
                <strong>Your progress</strong>
                <span className="body" style={{ fontSize: 14 }}>See your strengths grow across five areas of academic writing.</span>
              </div>
              <div className="card tight">
                <strong>Your bank and dictionary</strong>
                <span className="body" style={{ fontSize: 14 }}>Sentences you fix and words you collect come back, so the learning sticks.</span>
              </div>
            </div>
          </section>

          <form
            className="panel stack g20"
            style={{ padding: 32, alignSelf: "start" }}
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
    { n: 2, t: "Notes appear in the margin", d: "Each sentence is labelled with what it does. Blue marks what went well; amber marks the one sentence to improve." },
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
          <span className="body" style={{ color: "var(--blue-strong)" }}>Answer what you asked about · quote your own words · suit your subject and reader · show you a model paragraph to compare with · track your growth across five areas</span>
        </div>
        <div className="card amber">
          <span className="eyebrow amber">What it won’t do</span>
          <span className="body" style={{ color: "var(--amber-deep)" }}>Rewrite your paragraph for you · mark every small error · give you a grade</span>
        </div>
      </div>
      {standalone && (
        <Link href="/" className="btn" style={{ alignSelf: "flex-start" }}>Back to Today</Link>
      )}
    </section>
  );
}
