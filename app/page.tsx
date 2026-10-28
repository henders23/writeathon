"use client";

import Link from "next/link";
import { useEffect } from "react";
import AppShell from "@/components/AppShell";
import { Book, Bookmark, Check, Pen, Plus, Repeat, Scissors, Search, Snow } from "@/components/Icons";
import Loading from "@/components/Loading";
import Onboarding from "@/components/Onboarding";
import type { DailyPrompt } from "@/lib/bank/types";
import { FOCUS_BY_ID, ROWS, TASKS, WARMUP_WORDS, TARGET_WORDS } from "@/lib/content";
import { dayKey, greeting, longDate, weekdayLetter, weekdayName } from "@/lib/dates";
import { DISCIPLINE_LABEL } from "@/lib/disciplines";
import {
  counts,
  currentStreak,
  dictDue,
  dueBankItems,
  freezesAvailable,
  lastAttempt,
  lastSevenDays,
  reconcileFreezes,
  revisionDue,
  sessionsWithFeedback,
  todaysChoices,
} from "@/lib/progress";
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
  const week = lastSevenDays(profile, sessions, today);
  const freezes = freezesAvailable(profile, sessions);
  const wroteToday = sessions.some((s) => s.date === today && counts(s));
  const todaysSession = [...sessions].reverse().find((s) => s.date === today && counts(s));
  const choices = todaysChoices(profile, sessions, today);
  const warm = choices.some((c) => c.warmup);
  const focus = FOCUS_BY_ID[profile.focus.id];
  const lastGap = [...sessionsWithFeedback(sessions)].reverse().find((s) => s.feedback!.workOn?.focusId === focus.id);
  const due = dueBankItems(bank, today);
  const wordsDue = dictDue(dictionary, today);
  const reviseNow = revisionDue(sessions, today);

  return (
    <AppShell>
      <main className="container">
        <div className="row between wrap g16" style={{ alignItems: "flex-end" }}>
          <div className="stack g6">
            <p className="eyebrow">{longDate(today)}</p>
            <h1 className="h1">{greeting()}, {profile.name.split(/\s+/)[0]}.</h1>
          </div>
          {todaysSession && (
            <Link
              className="btn secondary small"
              href={todaysSession.mode === "hunt" ? `/hunt/results/${todaysSession.id}` : todaysSession.mode === "revise" ? `/revise/${todaysSession.id}` : `/feedback/${todaysSession.id}`}
            >
              See today’s feedback
            </Link>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 24, alignItems: "start" }}>
          <section className="stack g16" aria-labelledby="choose-h">
            <div className="row between wrap g8">
              <h2 id="choose-h" className="h2">{wroteToday ? "Write another?" : warm ? "Start with a warm-up" : "Choose today’s topic"}</h2>
              <span className="small">
                {warm
                  ? `Short and accessible · ${WARMUP_WORDS.min}–${WARMUP_WORDS.max} words`
                  : `${DISCIPLINE_LABEL[profile.discipline] ?? "General"} · one paragraph, ${TARGET_WORDS.min}–${TARGET_WORDS.max} words`}
              </span>
            </div>
            <div className="grid3">
              {choices.map((p) => (
                <TopicCard key={p.id} prompt={p} last={lastAttempt(sessions, p.id, today)?.date} />
              ))}
            </div>
            <div className="card" style={{ flexDirection: "row", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <span className="move-num" style={{ background: "var(--blue-tint)", color: "var(--blue)" }}><Plus /></span>
              <div className="stack g4 grow">
                <strong style={{ fontSize: 16 }}>Bring your own</strong>
                <span className="body" style={{ fontSize: 14 }}>Write about a question from your own module, or paste a short extract from something you’re reading.</span>
              </div>
              <div className="row g8 wrap">
                <Link className="btn secondary small" href="/own?type=topic">My own topic</Link>
                <Link className="btn secondary small" href="/own?type=source">My own source</Link>
              </div>
            </div>

            {reviseNow && (
              <div className="card blue" style={{ flexDirection: "row", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <Repeat color="var(--blue)" size={22} />
                <div className="stack g4 grow">
                  <strong style={{ color: "var(--blue-strong)" }}>Revision day</strong>
                  <span className="body" style={{ fontSize: 14, color: "var(--blue)" }}>Once a week, rework a whole paragraph instead of one sentence. Expert writers revise ideas and structure, not just words.</span>
                </div>
                <Link className="btn small" href="/revise">Revise a paragraph</Link>
              </div>
            )}
          </section>

          <aside className="stack g16" aria-label="Your day">
            <section className="card" aria-label="Your streak">
              <div className="row between">
                <div className="row g8" style={{ alignItems: "baseline" }}>
                  <span className="num" style={{ fontSize: 40, lineHeight: 1 }}>{streak}</span>
                  <span className="small" style={{ fontSize: 14 }}>day streak</span>
                </div>
                <span className="small" style={{ color: "var(--amber-text)" }}>{wroteToday ? "Done for today" : streak > 0 ? `Write to reach ${streak + 1}` : "Write today to start"}</span>
              </div>
              <div className="week">
                {week.map((d) => (
                  <div key={d.date} className={`day${d.isToday ? " today" : ""}`}>
                    <span aria-hidden="true">{weekdayLetter(d.date)}</span>
                    <span className={`day-mark ${d.status}`}>
                      {d.status === "done" && <Check color="var(--on-ink)" />}
                      {d.status === "frozen" && <Snow color="var(--blue)" />}
                      <span className="sr-only">{weekdayName(d.date)}: {d.status === "done" ? "wrote" : d.status === "frozen" ? "streak freeze" : d.status === "pending" ? "not yet" : "missed"}</span>
                    </span>
                  </div>
                ))}
              </div>
              <span className="small row g6"><Snow size={14} color="var(--blue)" /> {freezes} streak freeze{freezes === 1 ? "" : "s"} saved</span>
            </section>

            <section className="card amber" aria-label="Your focus">
              <span className="eyebrow amber">Your focus · {ROWS[focus.row].label}</span>
              <strong style={{ fontSize: 17 }}>{focus.label}</strong>
              <p className="body" style={{ fontSize: 14, color: "var(--ink-2)" }}>
                {lastGap ? `Last time you wrote “${lastGap.feedback!.workOn!.said}” ` : ""}
                {focus.why}
              </p>
              <div className="stack g4">
                {focus.phrases.map((p) => (
                  <span key={p} className="serif" style={{ fontStyle: "italic", fontSize: 16 }}>{p}</span>
                ))}
              </div>
            </section>

            {(due.length > 0 || wordsDue.length > 0) && (
              <section className="card" aria-label="Due today">
                <span className="eyebrow">Due today · about 2 minutes</span>
                {due.length > 0 && (
                  <Link href="/review" className="row g10" style={{ textDecoration: "none", color: "var(--ink)" }}>
                    <Bookmark size={20} color="var(--blue)" />
                    <span className="grow">Fix {due.length} banked sentence{due.length === 1 ? "" : "s"} from memory</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                )}
                {wordsDue.length > 0 && (
                  <Link href="/dictionary/quiz" className="row g10" style={{ textDecoration: "none", color: "var(--ink)" }}>
                    <Book size={20} color="var(--blue)" />
                    <span className="grow">Quiz {Math.min(10, wordsDue.length)} word{wordsDue.length === 1 ? "" : "s"} from your dictionary</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                )}
              </section>
            )}

            <section className="card" aria-label="Quick practice">
              <span className="eyebrow">Quick practice</span>
              <Link href="/surgery" className="row g10" style={{ textDecoration: "none", color: "var(--ink)" }}>
                <Scissors size={20} color="var(--blue)" />
                <span className="grow">Sentence Surgery · 90 seconds</span>
                <span aria-hidden="true">→</span>
              </Link>
              <Link href="/practice" className="row g10" style={{ textDecoration: "none", color: "var(--ink)" }}>
                <Search size={20} color="var(--amber)" />
                <span className="grow">More practice</span>
                <span aria-hidden="true">→</span>
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}

function TopicCard({ prompt, last }: { prompt: DailyPrompt; last?: string }) {
  const focusNote = prompt.source ? `Extract from ${prompt.source.cite}${prompt.source.journal ? `, ${prompt.source.journal}` : ""}` : "No source: your own ideas";
  return (
    <article className="topic">
      <span className="eyebrow">{prompt.warmup ? "Warm-up · " : ""}{TASKS[prompt.task].label}</span>
      <h3 className="h3" style={{ fontSize: 18 }}>{prompt.topic}</h3>
      <p className="body" style={{ fontSize: 15 }} data-dict="Writeathon task">{prompt.text}</p>
      <span className="small">{focusNote}{last ? " · you wrote on this before: beat it" : ""}</span>
      <div className="row g12 wrap" style={{ marginTop: "auto", paddingTop: 6 }}>
        <Link className="btn small" href={`/session?topic=${encodeURIComponent(prompt.id)}`}>
          <Pen size={16} color="var(--on-ink)" /> Write this
        </Link>
        <Link className="text-btn" href={`/hunt?topic=${encodeURIComponent(prompt.id)}`}>As Phrase Hunt</Link>
      </div>
    </article>
  );
}
