"use client";

import Link from "next/link";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import { Close } from "@/components/Icons";
import Loading from "@/components/Loading";
import Onboarding from "@/components/Onboarding";
import { dayKey, parseDay } from "@/lib/dates";
import { addWord } from "@/lib/dictionary";
import { REVIEW_INTERVALS, dictDue } from "@/lib/progress";
import { removeDictEntry, useAppState } from "@/lib/store";
import type { DictEntry } from "@/lib/types";

type Sort = "due" | "added" | "az";

function nextLabel(e: DictEntry, today: string) {
  if (e.step >= REVIEW_INTERVALS.length) return "Mastered";
  if (e.due <= today) return "Due now";
  const d = parseDay(e.due).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `Next quiz ${d}`;
}

export default function DictionaryPage() {
  const state = useAppState();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("due");
  const [word, setWord] = useState("");
  const [context, setContext] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  if (!state) return <Loading />;
  if (!state.profile) return <Onboarding />;
  const today = dayKey();
  const all = state.dictionary;
  const due = dictDue(all, today);
  const mastered = all.filter((e) => e.step >= REVIEW_INTERVALS.length).length;
  const shown = all
    .filter((e) => !q.trim() || `${e.word} ${e.definition}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => (sort === "az" ? a.word.localeCompare(b.word) : sort === "added" ? b.added.localeCompare(a.added) : a.due.localeCompare(b.due)));

  async function add() {
    if (!word.trim()) return;
    setBusy(true);
    await addWord(word.trim(), context.trim() || word.trim(), "Added by you");
    setBusy(false);
    setWord("");
    setContext("");
  }

  return (
    <AppShell>
      <main className="container">
        <div className="row between wrap g16" style={{ alignItems: "flex-end" }}>
          <div className="stack g6">
            <p className="eyebrow">Your dictionary</p>
            <h1 className="h1">{all.length ? `${all.length} word${all.length === 1 ? "" : "s"} collected` : "Collect words as you read"}</h1>
            <p className="lead" style={{ maxWidth: 760 }}>
              Select any word in a source, a task, your feedback or a model paragraph, then choose <strong>Add to my dictionary</strong>. Quizzes bring each word back after 1, 3, 7, 14 and 30 days until it’s yours.
            </p>
          </div>
          <div className="row g12">
            {due.length > 0 ? (
              <Link className="btn" href="/dictionary/quiz">Quiz {Math.min(10, due.length)} due word{due.length === 1 ? "" : "s"}</Link>
            ) : (
              all.length >= 1 && <Link className="btn secondary" href="/dictionary/quiz?practice=1">Practise anyway</Link>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 24, alignItems: "start" }} className="fb-grid">
          <section className="stack g16" aria-label="Your words">
            {all.length > 0 && (
              <div className="row between wrap g12">
                <input className="input" style={{ maxWidth: 360, flex: 1 }} type="search" placeholder="Search your words" aria-label="Search your words" value={q} onChange={(e) => setQ(e.target.value)} />
                <div className="row g8" role="group" aria-label="Sort">
                  {(["due", "added", "az"] as Sort[]).map((s) => (
                    <button key={s} className="chip" aria-pressed={sort === s} onClick={() => setSort(s)}>
                      {s === "due" ? "Due first" : s === "added" ? "Newest" : "A–Z"}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {all.length === 0 && (
              <div className="panel stack g12" style={{ padding: 32 }}>
                <p className="body">No words yet. The quickest way to start: open today’s source and select a word you don’t know.</p>
                <Link href="/" className="btn secondary" style={{ alignSelf: "flex-start" }}>Go to today’s topics</Link>
              </div>
            )}
            <div className="grid2">
              {shown.map((e) => (
                <article key={e.id} className="card word-card">
                  <div className="row between" style={{ alignItems: "flex-start" }}>
                    <div className="stack g4">
                      <span className="word">{e.word}</span>
                      <span className="small"><em>{e.partOfSpeech}</em></span>
                    </div>
                    <div className="stack g6" style={{ alignItems: "flex-end" }}>
                      <span className="dots" aria-label={`Mastery ${Math.min(e.step, REVIEW_INTERVALS.length)} of ${REVIEW_INTERVALS.length}`}>
                        {REVIEW_INTERVALS.map((_, i) => <span key={i} className={i < e.step ? "on" : ""} />)}
                      </span>
                      <span className={`pill ${e.step >= REVIEW_INTERVALS.length ? "blue" : e.due <= today ? "amber" : "grey"}`}>{nextLabel(e, today)}</span>
                    </div>
                  </div>
                  <p className="body" style={{ color: "var(--ink)" }}>{e.definition}</p>
                  {e.example && <p className="serif" style={{ margin: 0, fontStyle: "italic", fontSize: 16, color: "var(--ink-2)" }}>“{e.example}”</p>}
                  {e.collocations.length > 0 && (
                    <div className="row g6 wrap">
                      {e.collocations.map((c) => <span key={c} className="pill line">{c}</span>)}
                    </div>
                  )}
                  {e.context && e.context !== e.word && (
                    <details>
                      <summary className="small" style={{ cursor: "pointer" }}>Where you found it · {e.from}</summary>
                      <p className="small" style={{ marginTop: 6, color: "var(--ink-3)" }}>“{e.context}”</p>
                    </details>
                  )}
                  <div className="row between">
                    <span className="small">Added {parseDay(e.added).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                    {confirm === e.id ? (
                      <span className="row g8">
                        <button className="text-btn" style={{ color: "var(--danger)" }} onClick={() => { removeDictEntry(e.id); setConfirm(null); }}>Remove</button>
                        <button className="text-btn" onClick={() => setConfirm(null)}>Keep</button>
                      </span>
                    ) : (
                      <button className="text-btn row g4" style={{ color: "var(--muted)" }} onClick={() => setConfirm(e.id)} aria-label={`Remove ${e.word}`}>
                        <Close size={12} /> Remove
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="stack g16">
            <section className="card" aria-label="Summary">
              <div className="grid3" style={{ gap: 8 }}>
                <div className="stack g4"><span className="stat" style={{ fontSize: 30 }}>{all.length}</span><span className="small">words</span></div>
                <div className="stack g4"><span className="stat" style={{ fontSize: 30 }}>{due.length}</span><span className="small">due now</span></div>
                <div className="stack g4"><span className="stat" style={{ fontSize: 30 }}>{mastered}</span><span className="small">mastered</span></div>
              </div>
            </section>
            <form className="card" onSubmit={(e) => { e.preventDefault(); void add(); }}>
              <span className="eyebrow">Add a word yourself</span>
              <div className="field">
                <label htmlFor="w">Word or phrase</label>
                <input id="w" value={word} onChange={(e) => setWord(e.target.value)} placeholder="e.g. mitigate" maxLength={48} />
              </div>
              <div className="field">
                <label htmlFor="c">Sentence you saw it in <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
                <textarea id="c" rows={3} value={context} onChange={(e) => setContext(e.target.value)} />
                <span className="hint">The sentence helps pick the right meaning.</span>
              </div>
              <button className="btn small" type="submit" disabled={busy || !word.trim()} style={{ alignSelf: "flex-start" }}>{busy ? "Adding…" : "Add to my dictionary"}</button>
            </form>
            <section className="card flat">
              <span className="eyebrow">How quizzes work</span>
              <span className="body" style={{ fontSize: 14 }}>
                New words start with choosing the meaning. Then you fill a gap, then recall the word from its meaning, and finally write your own sentence with it. Get one wrong and it comes back tomorrow.
              </span>
            </section>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
