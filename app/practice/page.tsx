"use client";

import Link from "next/link";
import AppShell from "@/components/AppShell";
import Loading from "@/components/Loading";
import Onboarding from "@/components/Onboarding";
import { dayKey } from "@/lib/dates";
import { bestHuntThisWeek, bestSurgeryThisWeek, dictDue, dueBankItems, revisionCandidates, revisionDue, todaysChoices } from "@/lib/progress";
import { useAppState } from "@/lib/store";

type Drill = { id: string; title: string; note: string; href: string; go: string; due?: number };

export default function PracticePage() {
  const state = useAppState();
  if (!state) return <Loading />;
  if (!state.profile) return <Onboarding />;

  const today = dayKey();
  const { profile, sessions, bank, dictionary, surgeryRuns } = state;
  const [topic] = todaysChoices(profile, sessions, today);
  const bankDue = dueBankItems(bank, today, 99).length;
  const wordsDue = dictDue(dictionary, today).length;
  const toRevise = revisionCandidates(sessions, today).length;
  const bestSurgery = bestSurgeryThisWeek(surgeryRuns, today);
  const bestHunt = bestHuntThisWeek(sessions, today);

  const drills: Drill[] = [
    {
      id: "bank",
      title: bankDue ? `Fix ${bankDue} banked sentence${bankDue === 1 ? "" : "s"} from memory` : "Bank review",
      note: bankDue ? "Sentences you banked come back at growing gaps, so the fix sticks." : "Nothing due today. Open your bank to see what you’ve fixed.",
      href: bankDue ? "/review" : "/bank",
      go: bankDue ? "Review now" : "Open your bank",
      due: bankDue,
    },
    {
      id: "words",
      title: wordsDue ? `Quiz ${Math.min(10, wordsDue)} word${wordsDue === 1 ? "" : "s"} from your dictionary` : "Dictionary quiz",
      note: dictionary.length
        ? wordsDue
          ? "Meaning, gap-fill, recall and use, for the words that are due today."
          : "No words due today. Open your dictionary to see what you’ve collected."
        : "Select any word in a source or in your feedback to add it to your dictionary.",
      href: wordsDue ? "/dictionary/quiz" : "/dictionary",
      go: wordsDue ? "Start quiz" : "Open your dictionary",
      due: wordsDue,
    },
    {
      id: "revise",
      title: "Revise a paragraph",
      note: toRevise
        ? `Rework a whole paragraph from this week: its ideas and structure, not just words. ${toRevise} to choose from.`
        : "Rework a whole paragraph: its ideas and structure, not just words.",
      href: "/revise",
      go: toRevise ? "Choose a paragraph" : "See how it works",
      due: revisionDue(sessions, today) ? 1 : 0,
    },
    {
      id: "surgery",
      title: "Sentence Surgery",
      note: `Join short sentences into one academic sentence. 90 seconds${bestSurgery !== null ? ` · your best this week: ${bestSurgery}` : ""}.`,
      href: "/surgery",
      go: "Play",
    },
    ...(topic
      ? [
          {
            id: "hunt",
            title: "Phrase Hunt",
            note: `Study five phrases, then use them in a paragraph on “${topic.topic}”. About 7 minutes${bestHunt !== null ? ` · your best this week: ${bestHunt}` : ""}.`,
            href: `/hunt?topic=${encodeURIComponent(topic.id)}`,
            go: "Start",
          },
        ]
      : []),
    {
      id: "own",
      title: "Bring your own topic or source",
      note: "Practise on a question from your module, or a short extract from something you’re reading.",
      href: "/own?type=topic",
      go: "Set it up",
    },
  ];
  // The one thing to do: whatever is due comes first; otherwise the quickest game.
  const first = drills.find((d) => d.due) ?? drills.find((d) => d.id === "surgery")!;
  const rest = drills.filter((d) => d !== first);

  return (
    <AppShell>
      <main className="container focus">
        <div className="stack g6">
          <p className="small">Short drills for the skills behind good paragraphs</p>
          <h1 className="h1">Practice</h1>
        </div>

        <section className="panel hero" aria-labelledby="first-h">
          <p className="eyebrow">{first.due ? "Due today" : "Quick game"}</p>
          <h2 id="first-h" className="h2" style={{ fontSize: 32, lineHeight: 1.15 }}>{first.title}</h2>
          <p className="lead">{first.note}</p>
          <div className="row g20 wrap" style={{ marginTop: 12 }}>
            <Link className="btn big" href={first.href}>{first.go}</Link>
          </div>
        </section>

        <section className="stack g12" aria-labelledby="rest-h">
          <h2 id="rest-h" className="h2" style={{ fontSize: 24 }}>Or practise something else</h2>
          {rest.map((d) => (
            <Link key={d.id} className="alt-topic" href={d.href}>
              <span className="stack g4">
                <strong>{d.title}</strong>
                <span className="small">{d.note}</span>
              </span>
              <span className="go">{d.go} →</span>
            </Link>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
