"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import AppShell from "@/components/AppShell";
import Loading from "@/components/Loading";
import Onboarding from "@/components/Onboarding";
import type { DailyPrompt, Source, TaskId } from "@/lib/bank/types";
import { TASKS } from "@/lib/content";
import { wordCount } from "@/lib/match";
import { addCustomPrompt, newId, useAppState } from "@/lib/store";

const TOPIC_TASKS: TaskId[] = ["position", "cause", "compare", "define", "problem", "counter"];
const SOURCE_TASKS: TaskId[] = ["respond", "apply", "data", "cause", "problem", "compare"];

function citeFrom(authors: string, year: string) {
  // Accepts "Okafor, C. and Lee, K.", "Chris Okafor & Kim Lee" or "Okafor; Lee; Patel".
  const etAl = /\bet al\b/i.test(authors);
  const tokens = authors.replace(/\bet al\.?/gi, "").split(/,|;|\band\b|&/).map((x) => x.trim()).filter(Boolean);
  const names = tokens.filter((t) => !/^(?:[A-Z]\.?[\s-]*)+$/.test(t));
  const surname = (n: string) => n.split(/\s+/).filter((w) => !/^[A-Z]\.?$/.test(w)).pop() ?? n;
  const y = year.trim() || "n.d.";
  if (names.length === 0) return `Source (${y})`;
  if (names.length === 1 && !etAl) return `${surname(names[0])} (${y})`;
  if (names.length === 2 && !etAl) return `${surname(names[0])} and ${surname(names[1])} (${y})`;
  return `${surname(names[0])} et al. (${y})`;
}

type Extract = { text: string; authors: string; year: string; title: string; link: string };
const EMPTY: Extract = { text: "", authors: "", year: "", title: "", link: "" };

function toSource(x: Extract, task: TaskId): Source {
  return {
    kind: task === "data" ? "data" : "text",
    text: x.text.trim(),
    cite: citeFrom(x.authors, x.year),
    authors: x.authors.trim(),
    year: Number(x.year) || new Date().getFullYear(),
    title: x.title.trim(),
    journal: "",
    url: x.link.trim(),
    license: "",
    own: true,
  };
}

function OwnForm() {
  const state = useAppState();
  const router = useRouter();
  const params = useSearchParams();
  const [type, setType] = useState<"topic" | "source">(params.get("type") === "source" ? "source" : "topic");
  const [question, setQuestion] = useState("");
  const [task, setTask] = useState<TaskId>(type === "source" ? "respond" : "position");
  const [extracts, setExtracts] = useState<Extract[]>([{ ...EMPTY }]);
  const setField = (i: number, k: keyof Extract, v: string) => setExtracts((xs) => xs.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  if (!state) return <Loading />;
  if (!state.profile) return <Onboarding />;

  const okExtract = (x: Extract) => wordCount(x.text) >= 15 && wordCount(x.text) <= 250 && x.authors.trim().length > 0;
  const filled = extracts.filter((x) => x.text.trim() || x.authors.trim());
  const ready = type === "topic" ? question.trim().length >= 10 : filled.length > 0 && filled.every(okExtract);

  function start() {
    if (!ready) return;
    const id = `own-${newId()}`;
    const srcs = filled.map((x) => toSource(x, task));
    const cite = srcs[0]?.cite ?? "";
    const p: DailyPrompt =
      type === "topic"
        ? { id, task, topic: question.trim().slice(0, 48), text: `${question.trim()} Answer in one paragraph.` }
        : {
            id,
            task,
            topic: filled[0]?.title.trim().slice(0, 48) || `Your source${srcs.length > 1 ? "s" : ""}: ${cite}`,
            text: question.trim()
              ? `${question.trim()} Use ${cite} in one paragraph.`
              : `${TASKS[task].label}: write one paragraph using ${cite}.`,
            source: srcs[0],
            more: srcs.slice(1),
          };
    addCustomPrompt(p);
    router.push(`/session?topic=${encodeURIComponent(id)}${type === "source" && filled.length > 1 ? `&n=${filled.length}` : ""}`);
  }

  const tasks = type === "topic" ? TOPIC_TASKS : SOURCE_TASKS;

  return (
    <AppShell>
      <main className="container mid">
        <div className="stack g8">
          <h1 className="h1">Bring your own</h1>
          <p className="lead">Practise on something that matters to you: a question from your module, or a short extract from something you’re reading.</p>
        </div>
        <div role="group" aria-label="What are you bringing?" className="row g8">
          <button className="chip" aria-pressed={type === "topic"} onClick={() => { setType("topic"); setTask("position"); }}>My own topic</button>
          <button className="chip" aria-pressed={type === "source"} onClick={() => { setType("source"); setTask("respond"); }}>My own source</button>
        </div>

        <form className="panel stack g20" style={{ padding: 28 }} onSubmit={(e) => { e.preventDefault(); start(); }}>
          {type === "source" && (
            <>
              {extracts.map((x, i) => {
                const w = wordCount(x.text);
                return (
                  <fieldset key={i} className="stack g16" style={{ border: "1px solid var(--line)", borderRadius: 16, padding: 18, margin: 0 }}>
                    <legend className="label" style={{ padding: "0 6px" }}>Extract {i + 1}{i > 0 ? " (optional)" : ""}</legend>
                    <div className="field">
                      <label htmlFor={`extract-${i}`}>The extract</label>
                      <textarea id={`extract-${i}`} rows={5} value={x.text} onChange={(e) => setField(i, "text", e.target.value)} placeholder="Paste a short passage (about 30–150 words) from an article, book or report you’re reading." style={{ fontFamily: "var(--serif)", fontSize: 17 }} />
                      <span className="hint">{w} words{w > 250 ? " · too long: choose the key 30–150 words" : ""}{i === 0 ? ". Pasting is fine here: it’s someone else’s writing." : ""}</span>
                    </div>
                    <div className="grid2">
                      <div className="field">
                        <label htmlFor={`authors-${i}`}>Author(s)</label>
                        <input id={`authors-${i}`} value={x.authors} onChange={(e) => setField(i, "authors", e.target.value)} placeholder="e.g. Okafor, C. and Lee, K." />
                      </div>
                      <div className="field">
                        <label htmlFor={`year-${i}`}>Year</label>
                        <input id={`year-${i}`} inputMode="numeric" value={x.year} onChange={(e) => setField(i, "year", e.target.value)} placeholder="e.g. 2022" />
                      </div>
                    </div>
                    <div className="grid2">
                      <div className="field">
                        <label htmlFor={`title-${i}`}>Title <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
                        <input id={`title-${i}`} value={x.title} onChange={(e) => setField(i, "title", e.target.value)} />
                      </div>
                      <div className="field">
                        <label htmlFor={`link-${i}`}>Link <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
                        <input id={`link-${i}`} value={x.link} onChange={(e) => setField(i, "link", e.target.value)} placeholder="https://" />
                      </div>
                    </div>
                    <div className="row between">
                      {x.authors ? <p className="small">You’ll cite it as <strong style={{ color: "var(--ink)" }}>{citeFrom(x.authors, x.year)}</strong>.</p> : <span />}
                      {i > 0 && <button type="button" className="text-btn" onClick={() => setExtracts((xs) => xs.filter((_, j) => j !== i))}>Remove</button>}
                    </div>
                  </fieldset>
                );
              })}
              {extracts.length < 3 && (
                <div className="row g12 wrap">
                  <button type="button" className="btn secondary small" onClick={() => setExtracts((xs) => [...xs, { ...EMPTY }])}>+ Add another source</button>
                  <span className="small">Use 2 or 3 sources to practise synthesis: bringing sources together to make your own point.</span>
                </div>
              )}
            </>
          )}

          <div className="field">
            <label htmlFor="question">{type === "topic" ? "Your question" : "Your question about it"}{type === "source" && <span style={{ fontWeight: 400, color: "var(--muted)" }}> (optional)</span>}</label>
            <textarea id="question" rows={2} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={type === "topic" ? "e.g. Should first-year law students be taught through problem questions?" : "e.g. How far do you agree with the author’s conclusion?"} />
          </div>

          <div className="stack g8">
            <span className="label">What kind of paragraph?</span>
            <div className="row g8 wrap">
              {tasks.map((t) => (
                <button type="button" key={t} className="chip" aria-pressed={task === t} onClick={() => setTask(t)}>{TASKS[t].label}</button>
              ))}
            </div>
            <span className="small">A paragraph like this usually: {TASKS[task].moves.join(" → ")}</span>
          </div>

          <button className="btn" type="submit" disabled={!ready} style={{ alignSelf: "flex-start" }}>Plan my paragraph</button>
        </form>
      </main>
    </AppShell>
  );
}

export default function OwnPage() {
  return (
    <Suspense fallback={<Loading />}>
      <OwnForm />
    </Suspense>
  );
}
