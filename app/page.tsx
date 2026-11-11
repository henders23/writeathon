"use client";

import Link from "next/link";
import { useEffect } from "react";
import AppShell from "@/components/AppShell";
import { Pen } from "@/components/Icons";
import Loading from "@/components/Loading";
import Onboarding from "@/components/Onboarding";
import type { DailyPrompt } from "@/lib/bank/types";
import { FOCUS_BY_ID, TASKS, targetFor } from "@/lib/content";
import { dayKey, greeting, longDate } from "@/lib/dates";
import {
  counts,
  currentStreak,
  dictDue,
  dueBankItems,
  focusForDay,
  lastAttempt,
  reconcileFreezes,
  revisionDue,
  todaysChoices,
} from "@/lib/progress";
import { availableSources } from "@/lib/sources";
import { saveProfile, useAppState } from "@/lib/store";

export default function Today() {
  const state = useAppState();

  useEffect(() => {
    if (!state?.profile) return;
    const next = reconcileFreezes(state);
    if (next) saveProfile(next);
  }, [state]);

  if (!state) return <Loading />;
  if (!state.profile) return <Onboarding />;

  const { profile, sessions, bank, dictionary } = state;
  const today = dayKey();
  const streak = currentStreak(profile, sessions, today);
  const wroteToday = sessions.some((s) => s.date === today && counts(s));
  const todaysSession = [...sessions].reverse().find((s) => s.date === today && counts(s));
  const [first, ...others] = todaysChoices(profile, sessions, today);
  const due = dueBankItems(bank, today);
  const wordsDue = dictDue(dictionary, today);
  const reviseNow = revisionDue(sessions, today);
  const feedbackHref = todaysSession
    ? todaysSession.mode === "hunt"
      ? `/hunt/results/${todaysSession.id}`
      : todaysSession.mode === "revise"
        ? `/revise/${todaysSession.id}`
        : `/feedback/${todaysSession.id}`
    : null;
  const streakLine = wroteToday
    ? `${streak}-day streak · done for today`
    : streak > 0
      ? `${streak}-day streak · write to reach ${streak + 1}`
      : "Write today to start a streak";
  const hasAfter = due.length > 0 || wordsDue.length > 0 || reviseNow;

  return (
    <AppShell>
      <main className="container focus">
        <div className="stack g6">
          <p className="small">{longDate(today)} · {streakLine}</p>
          <h1 className="h1">{greeting()}, {profile.name.split(/\s+/)[0]}.</h1>
        </div>

        {first && <TodayCard prompt={first} focusId={focusForDay(profile, first)} again={wroteToday} repeat={Boolean(lastAttempt(sessions, first.id, today))} feedbackHref={feedbackHref} />}

        <section className="stack g12" aria-labelledby="other-h">
          <h2 id="other-h" className="h2" style={{ fontSize: 24 }}>Or choose a different topic</h2>
          {others.map((p) => (
            <AltTopic key={p.id} prompt={p} />
          ))}
          <Link className="alt-topic" href="/own?type=topic">
            <span className="stack g4">
              <strong>Bring your own</strong>
              <span className="small">A question from your module, or an extract from something you’re reading</span>
            </span>
            <span className="go">Set it up →</span>
          </Link>
        </section>

        {hasAfter && (
          <section className="stack g6" aria-labelledby="after-h">
            <h2 id="after-h" className="quiet-h">{wroteToday ? "Also today" : "After you write"}</h2>
            {due.length > 0 && (
              <Link className="text-btn" href="/review">Fix {due.length} banked sentence{due.length === 1 ? "" : "s"} from memory</Link>
            )}
            {wordsDue.length > 0 && (
              <Link className="text-btn" href="/dictionary/quiz">Quiz {Math.min(10, wordsDue.length)} word{wordsDue.length === 1 ? "" : "s"} from your dictionary</Link>
            )}
            {reviseNow && <Link className="text-btn" href="/revise">Revision day: rework one whole paragraph</Link>}
          </section>
        )}
      </main>
    </AppShell>
  );
}

function sourceNote(prompt: DailyPrompt) {
  const n = availableSources(prompt).length;
  return n === 0 ? "No source: your own ideas" : n > 1 ? `Up to ${n} sources` : "One source";
}

/** The one thing to do today: a single recommended topic and a single button. */
function TodayCard({ prompt, focusId, again, repeat, feedbackHref }: { prompt: DailyPrompt; focusId: string; again: boolean; repeat: boolean; feedbackHref: string | null }) {
  const target = targetFor(prompt.warmup, 1);
  const focus = FOCUS_BY_ID[focusId];
  return (
    <section className="panel hero" aria-labelledby="today-h">
      <p className="eyebrow">
        {again ? "Write another" : prompt.warmup ? "Start with a warm-up" : "Today’s paragraph"} · {TASKS[prompt.task].label}
      </p>
      <h2 id="today-h" className="h2" style={{ fontSize: 32, lineHeight: 1.15 }}>{prompt.topic}</h2>
      <p className="lead" data-dict="Writeathon task">{prompt.text}</p>
      <p className="small" style={{ fontSize: 14 }}>
        {sourceNote(prompt)} · {target.min}–{target.max} words{focus ? ` · focus on ${focus.label.charAt(0).toLowerCase()}${focus.label.slice(1)}` : ""}
        {repeat ? " · you wrote on this before: beat it" : ""}
      </p>
      <div className="row g20 wrap" style={{ marginTop: 12 }}>
        <Link className="btn big" href={`/session?topic=${encodeURIComponent(prompt.id)}`}>
          <Pen size={18} color="var(--on-ink)" /> Start writing
        </Link>
        {feedbackHref && <Link className="text-btn" href={feedbackHref}>See today’s feedback</Link>}
      </div>
    </section>
  );
}

function AltTopic({ prompt }: { prompt: DailyPrompt }) {
  return (
    <Link className="alt-topic" href={`/session?topic=${encodeURIComponent(prompt.id)}`}>
      <span className="stack g4">
        <strong>{prompt.topic}</strong>
        <span className="small">{TASKS[prompt.task].label} · {sourceNote(prompt)}</span>
      </span>
      <span className="go">Write this →</span>
    </Link>
  );
}
