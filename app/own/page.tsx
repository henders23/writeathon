"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import AppShell from "@/components/AppShell";
import Loading from "@/components/Loading";
import Onboarding from "@/components/Onboarding";
import type { DailyPrompt, TaskId } from "@/lib/bank/types";
import { TASKS } from "@/lib/content";
import { wordCount } from "@/lib/match";
import { addCustomPrompt, newId, useAppState } from "@/lib/store";

const TOPIC_TASKS: TaskId[] = ["position", "cause", "compare", "define", "problem", "counter"];
const SOURCE_TASKS: TaskId[] = ["respond", "apply", "data", "cause", "problem", "compare"];

function citeFrom(authors: string, year: string) {
  const names = authors.split(/,| and |&/).map((x) => x.trim()).filter(Boolean);
  const surname = (n: string) => n.split(/\s+/).filter((w) => !/^[A-Z]\.?$/.test(w)).pop() ?? n;
  const y = year.trim() || "n.d.";
  if (names.length === 0) return `Source (${y})`;
  if (names.length === 1) return `${surname(names[0])} (${y})`;
  if (names.length === 2) return `${surname(names[0])} and ${surname(names[1])} (${y})`;
  return `${surname(names[0])} et al. (${y})`;
}

function OwnForm() {
  const state = useAppState();
  const router = useRouter();
  const params = useSearchParams();
  const [type, setType] = useState<"topic" | "source">(params.get("type") === "source" ? "source" : "topic");
  const [question, setQuestion] = useState("");
  const [task, setTask] = useState<TaskId>(type === "source" ? "respond" : "position");
  const [extract, setExtract] = useState("");
  const [authors, setAuthors] = useState("");
  const [year, setYear] = useState("");
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");

  if (!state) return <Loading />;
  if (!state.profile) return <Onboarding />;

  const extractWords = wordCount(extract);
  const ready =
    type === "topic" ? question.trim().length >= 10 : extractWords >= 15 && extractWords <= 250 && authors.trim().length > 0;

  function start() {
    if (!ready) return;
    const id = `own-${newId()}`;
    const cite = citeFrom(authors, year);
    const p: DailyPrompt =
      type === "topic"
        ? { id, task, topic: question.trim().slice(0, 48), text: `${question.trim()} Answer in one paragraph.` }
        : {
            id,
            task,
            topic: title.trim().slice(0, 48) || `Your source: ${cite}`,
            text: question.trim()
              ? `${question.trim()} Use ${cite} in one paragraph.`
              : `${TASKS[task].label}: write one paragraph using ${cite}.`,
            source: {
              kind: task === "data" ? "data" : "text",
              text: extract.trim(),
              cite,
              authors: authors.trim(),
              year: Number(year) || new Date().getFullYear(),
              title: title.trim(),
              journal: "",
              url: link.trim(),
              license: "",
              own: true,
            },
          };
    addCustomPrompt(p);
    router.push(`/session?topic=${encodeURIComponent(id)}`);
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
              <div className="field">
                <label htmlFor="extract">The extract</label>
                <textarea id="extract" rows={6} value={extract} onChange={(e) => setExtract(e.target.value)} placeholder="Paste a short passage (about 30–150 words) from an article, book or report you’re reading." style={{ fontFamily: "var(--serif)", fontSize: 17 }} />
                <span className="hint">{extractWords} words{extractWords > 250 ? " · too long: choose the key 30–150 words" : ""}. Pasting is fine here: it’s someone else’s writing.</span>
              </div>
              <div className="grid2">
                <div className="field">
                  <label htmlFor="authors">Author(s)</label>
                  <input id="authors" value={authors} onChange={(e) => setAuthors(e.target.value)} placeholder="e.g. Okafor, C. and Lee, K." />
                </div>
                <div className="field">
                  <label htmlFor="year">Year</label>
                  <input id="year" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2022" />
                </div>
              </div>
              <div className="grid2">
                <div className="field">
                  <label htmlFor="title">Title <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
                  <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="link">Link <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
                  <input id="link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" />
                </div>
              </div>
              {authors && <p className="small">You’ll cite it as <strong style={{ color: "var(--ink)" }}>{citeFrom(authors, year)}</strong>.</p>}
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
