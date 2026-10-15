"use client";

import Link from "next/link";
import { useEffect } from "react";
import FrameLine from "@/components/FrameLine";
import { Bookmark, Check, Flame, Pen, Repeat, Scissors, Search, Snow } from "@/components/Icons";
import Loading from "@/components/Loading";
import Onboarding from "@/components/Onboarding";
import TabBar from "@/components/TabBar";
import { FOCUS_BY_ID, ROWS, TASKS } from "@/lib/content";
import { dayKey, greeting, longDate, parseDay, weekdayLetter, weekdayName } from "@/lib/dates";

function shortDate(key: string) {
  return parseDay(key).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}
import { DISCIPLINE_LABEL } from "@/lib/disciplines";
import {
  counts,
  currentStreak,
  dueBankItems,
  lastAttempt,
  revisionDue,
  focusForDay,
  freezesAvailable,
  lastSevenDays,
  reconcileFreezes,
  sessionsWithFeedback,
  todaysPrompt,
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

  const { profile, sessions, bank } = state;
  const today = dayKey();
  const streak = currentStreak(profile, sessions, today);
  const week = lastSevenDays(profile, sessions, today);
  const freezes = freezesAvailable(profile, sessions);
  const frozenThisWeek = week.find((d) => d.status === "frozen");
  const wroteToday = sessions.some((s) => s.date === today && counts(s));
  const todaysSession = [...sessions].reverse().find((s) => s.date === today && counts(s));
  const prompt = todaysPrompt(profile, today);
  const focus = FOCUS_BY_ID[focusForDay(profile, prompt)];
  const resting = focus.id !== profile.focus.id ? FOCUS_BY_ID[profile.focus.id] : null;
  const lastGap = [...sessionsWithFeedback(sessions)].reverse().find((s) => s.feedback!.workOn?.focusId === focus.id);
  const due = dueBankItems(bank, today);
  const repeat = lastAttempt(sessions, prompt.id, today);
  const reviseNow = revisionDue(sessions, today);
  const revisedToday = sessions.find((s) => s.date === today && s.mode === "revise");
  const initials = profile.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="shell">
      <div className="page with-tabs">
        <div className="row between">
          <div className="wordmark">Writeathon</div>
          <Link href="/profile" className="icon-btn" aria-label="Your profile and settings" style={{ color: "var(--blue)" }}>
            {initials}
          </Link>
        </div>

        <div className="stack gap-4">
          <p className="eyebrow">{longDate(today)}</p>
          <h1 className="h1">
            {greeting()}, {profile.name.split(/\s+/)[0]}.
          </h1>
        </div>

        <section className="card" aria-label="Your streak">
          <div className="row gap-14">
            <Flame size={40} color="var(--amber)" strokeWidth={1.6} />
            <div className="stack">
              <div className="row gap-6" style={{ alignItems: "baseline" }}>
                <span className="serif" style={{ fontSize: 40, lineHeight: 1, fontWeight: 500 }}>
                  {streak}
                </span>
                <span style={{ fontSize: 15, color: "var(--muted)" }}>day streak</span>
              </div>
              <span style={{ fontSize: 13, color: "var(--amber-text)" }}>
                {wroteToday ? "Done for today. See you tomorrow." : streak > 0 ? `Write today to reach ${streak + 1}` : "Write today to start your streak"}
              </span>
            </div>
          </div>
          <div className="week">
            {week.map((d) => (
              <div key={d.date} className={`day${d.isToday ? " today" : ""}`}>
                <span>{weekdayLetter(d.date)}</span>
                <span className={`day-mark ${d.status}`}>
                  {d.status === "done" && <Check color="var(--card)" />}
                  {d.status === "frozen" && <Snow color="var(--blue)" />}
                  <span className="sr-only">
                    {weekdayName(d.date)}: {d.status === "done" ? "wrote" : d.status === "frozen" ? "streak freeze" : d.status === "pending" ? "not yet" : "missed"}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <p className="small row gap-6">
            <Snow size={14} color="var(--blue)" />
            <span>
              {frozenThisWeek ? `Streak freeze used ${weekdayName(frozenThisWeek.date)} · ` : ""}
              {freezes} streak freeze{freezes === 1 ? "" : "s"} saved
            </span>
          </p>
        </section>

        {(reviseNow || revisedToday) && (
          <section className="card blue" aria-label="Revision day">
            <div className="row gap-8">
              <Repeat size={18} color="var(--blue)" />
              <span className="eyebrow blue">Revision day</span>
            </div>
            <p className="body" style={{ color: "var(--ink-2)" }}>
              Once a week, rework a whole paragraph instead of one sentence. Expert writers revise their ideas and structure, not just their words.
            </p>
            {revisedToday ? (
              <Link href={`/revise/${revisedToday.id}`} className="small" style={{ color: "var(--blue)" }}>See today&apos;s revision</Link>
            ) : (
              <Link href="/revise" className="btn">
                <Repeat color="var(--card)" size={20} />
                <span>Revise a paragraph from this week</span>
              </Link>
            )}
            {!revisedToday && <p className="small">Or write today&apos;s new paragraph below. Either keeps your streak.</p>}
          </section>
        )}

        <section className="card" aria-label="Today's writing">
          <p className="eyebrow">
            Today · {TASKS[prompt.task].label} · {DISCIPLINE_LABEL[profile.discipline] ?? "General"}
          </p>
          {prompt.frame && <FrameLine frame={prompt.frame} />}
          <p className="prompt-text">{prompt.text}</p>
          {repeat && (
            <p className="small" style={{ color: "var(--amber-deep)" }}>
              You answered this question on {shortDate(repeat.date)}. Today, beat your last attempt.
            </p>
          )}
          <p className="small">{prompt.source ? `With a short source (${prompt.source.author}, ${prompt.source.year}).` : "No source today: your own ideas."} One paragraph, about 100–150 words.</p>
          <Link href="/write" className="btn">
            <Pen color="var(--card)" />
            <span>{wroteToday ? "Write again" : "Start 10-minute session"}</span>
          </Link>
          <Link href="/hunt" className="btn secondary" style={{ marginTop: -6 }}>
            <Search color="var(--amber)" />
            <span>Play as Phrase Hunt</span>
          </Link>
          {todaysSession && (
            <Link
              href={todaysSession.mode === "hunt" ? `/hunt/results/${todaysSession.id}` : todaysSession.mode === "revise" ? `/revise/${todaysSession.id}` : `/feedback/${todaysSession.id}`}
              className="small"
              style={{ color: "var(--blue)" }}
            >
              See today&apos;s feedback
            </Link>
          )}
        </section>

        <section className="card amber" aria-label="Today's focus">
          <div className="row gap-8">
            <span className="dot amber" />
            <span className="eyebrow amber">Today&apos;s focus · {ROWS[focus.row].label}</span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{focus.label}</div>
          <p className="body" style={{ color: "var(--ink-2)" }}>
            {lastGap ? `Last time you wrote “${lastGap.feedback!.workOn!.said}” ` : ""}
            {focus.why}
          </p>
          <div className="stack gap-4">
            {focus.phrases.map((p) => (
              <span key={p} className="serif" style={{ fontStyle: "italic", fontSize: 17 }}>
                {p}
              </span>
            ))}
          </div>
          {resting && (
            <p className="small" style={{ color: "var(--amber-deep)" }}>
              Your main focus, {resting.label.toLowerCase()}, needs a source, so it takes a rest today.
            </p>
          )}
        </section>

        {due.length > 0 && (
          <Link href="/review" className="card tight row gap-12" style={{ flexDirection: "row", alignItems: "center", textDecoration: "none", color: "var(--ink)" }}>
            <Bookmark color="var(--blue)" size={22} />
            <span className="stack gap-2 grow">
              <span style={{ fontSize: 15, fontWeight: 600 }}>Bank review · {due.length} due</span>
              <span className="small">Fix {due.length === 1 ? "a sentence" : "sentences"} you fixed before, from memory. About a minute.</span>
            </span>
          </Link>
        )}

        <Link href="/surgery" className="card tight row gap-12" style={{ flexDirection: "row", alignItems: "center", textDecoration: "none", color: "var(--ink)" }}>
          <Scissors color="var(--blue)" size={22} />
          <span className="stack gap-2 grow">
            <span style={{ fontSize: 15, fontWeight: 600 }}>Sentence Surgery</span>
            <span className="small">90-second warm-up: join short sentences into one academic sentence.</span>
          </span>
        </Link>
      </div>
      <TabBar />
    </main>
  );
}
