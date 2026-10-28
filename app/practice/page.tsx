"use client";

import Link from "next/link";
import AppShell from "@/components/AppShell";
import { Book, Bookmark, Plus, Repeat, Scissors, Search } from "@/components/Icons";
import Loading from "@/components/Loading";
import Onboarding from "@/components/Onboarding";
import { TASKS } from "@/lib/content";
import { dayKey } from "@/lib/dates";
import { bestHuntThisWeek, bestSurgeryThisWeek, dictDue, dueBankItems, revisionCandidates, todaysChoices } from "@/lib/progress";
import { useAppState } from "@/lib/store";

function Count({ n, label }: { n: number; label: string }) {
  return (
    <span className={`pill ${n > 0 ? "amber" : "grey"}`}>
      {n} {label}
    </span>
  );
}

export default function PracticePage() {
  const state = useAppState();
  if (!state) return <Loading />;
  if (!state.profile) return <Onboarding />;

  const today = dayKey();
  const { profile, sessions, bank, dictionary, surgeryRuns } = state;
  const choices = todaysChoices(profile, sessions, today);
  const bankDue = dueBankItems(bank, today, 99).length;
  const wordsDue = dictDue(dictionary, today).length;
  const toRevise = revisionCandidates(sessions, today).length;
  const bestSurgery = bestSurgeryThisWeek(surgeryRuns, today);
  const bestHunt = bestHuntThisWeek(sessions, today);

  return (
    <AppShell>
      <main className="container">
        <div className="stack g8">
          <p className="eyebrow">Training ground</p>
          <h1 className="h1">Practice</h1>
          <p className="lead" style={{ maxWidth: 760 }}>Short drills for the skills behind good paragraphs. Use them on days you want more, or when something comes back for review.</p>
        </div>

        <section className="stack g12" aria-labelledby="games-h">
          <h2 id="games-h" className="h2">Quick games</h2>
          <div className="grid2">
            <article className="card">
              <div className="row between">
                <span className="eyebrow blue row g6"><Scissors size={16} color="var(--blue)" /> Sentence Surgery</span>
                <span className="small">90 seconds</span>
              </div>
              <strong style={{ fontSize: 18 }}>Join short sentences into one academic sentence</strong>
              <p className="body" style={{ fontSize: 14 }}>Three operations against the clock. Builds the sentence control that lets you pack ideas together clearly.</p>
              <div className="row between" style={{ marginTop: "auto" }}>
                <span className="small">{bestSurgery !== null ? `Your best this week: ${bestSurgery}` : "No runs this week yet"}</span>
                <Link className="btn small" href="/surgery">Play</Link>
              </div>
            </article>
            <article className="card">
              <div className="row between">
                <span className="eyebrow amber row g6"><Search size={16} color="var(--amber)" /> Phrase Hunt</span>
                <span className="small">about 7 minutes</span>
              </div>
              <strong style={{ fontSize: 18 }}>Study five phrases, then use them in a paragraph</strong>
              <p className="body" style={{ fontSize: 14 }}>A full paragraph with a game on top. Choose one of today’s topics.</p>
              <div className="stack g8" style={{ marginTop: "auto" }}>
                {choices.map((p) => (
                  <Link key={p.id} href={`/hunt?topic=${encodeURIComponent(p.id)}`} className="row g10" style={{ textDecoration: "none", color: "var(--ink)" }}>
                    <span className="grow">
                      <strong style={{ fontSize: 14 }}>{p.topic}</strong>
                      <span className="small"> · {TASKS[p.task].label}</span>
                    </span>
                    <span aria-hidden="true">→</span>
                  </Link>
                ))}
                {bestHunt !== null && <span className="small">Your best this week: {bestHunt}</span>}
              </div>
            </article>
          </div>
        </section>

        <section className="stack g12" aria-labelledby="review-h">
          <h2 id="review-h" className="h2">Make it stick</h2>
          <div className="grid3">
            <article className="card">
              <div className="row between">
                <span className="eyebrow row g6"><Bookmark size={16} color="var(--blue)" /> Bank review</span>
                <Count n={bankDue} label="due" />
              </div>
              <p className="body" style={{ fontSize: 14 }}>Fix sentences you banked again, from memory, at growing gaps.</p>
              <Link className={`btn small${bankDue ? "" : " secondary"}`} style={{ marginTop: "auto", alignSelf: "flex-start" }} href={bankDue ? "/review" : "/bank"}>
                {bankDue ? "Review now" : "Open your bank"}
              </Link>
            </article>
            <article className="card">
              <div className="row between">
                <span className="eyebrow row g6"><Book size={16} color="var(--blue)" /> Dictionary quiz</span>
                <Count n={wordsDue} label="due" />
              </div>
              <p className="body" style={{ fontSize: 14 }}>
                {dictionary.length
                  ? `Quiz yourself on the ${dictionary.length} word${dictionary.length === 1 ? "" : "s"} you’ve collected: meaning, gap-fill, recall and use.`
                  : "Select any word in a source or in your feedback to add it to your dictionary. Then quiz yourself here."}
              </p>
              <Link className={`btn small${wordsDue ? "" : " secondary"}`} style={{ marginTop: "auto", alignSelf: "flex-start" }} href={wordsDue ? "/dictionary/quiz" : "/dictionary"}>
                {wordsDue ? "Start quiz" : "Open your dictionary"}
              </Link>
            </article>
            <article className="card">
              <div className="row between">
                <span className="eyebrow row g6"><Repeat size={16} color="var(--blue)" /> Revise a paragraph</span>
                <Count n={toRevise} label="to choose from" />
              </div>
              <p className="body" style={{ fontSize: 14 }}>Rework a whole paragraph from this week: its ideas and structure, not just words.</p>
              <Link className={`btn small${toRevise ? "" : " secondary"}`} style={{ marginTop: "auto", alignSelf: "flex-start" }} href="/revise">
                {toRevise ? "Choose a paragraph" : "See how revision works"}
              </Link>
            </article>
          </div>
        </section>

        <section className="card" style={{ flexDirection: "row", alignItems: "center", gap: 20, flexWrap: "wrap" }} aria-label="Bring your own">
          <span className="move-num" style={{ background: "var(--blue-tint)", color: "var(--blue)" }}><Plus /></span>
          <div className="stack g4 grow">
            <strong style={{ fontSize: 16 }}>Bring your own topic or source</strong>
            <span className="body" style={{ fontSize: 14 }}>Practise on a question from your module, or a short extract from something you’re reading.</span>
          </div>
          <div className="row g8 wrap">
            <Link className="btn secondary small" href="/own?type=topic">My own topic</Link>
            <Link className="btn secondary small" href="/own?type=source">My own source</Link>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
