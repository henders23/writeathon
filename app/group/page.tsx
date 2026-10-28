"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { Check } from "@/components/Icons";
import Loading from "@/components/Loading";
import Onboarding from "@/components/Onboarding";
import { FOCUS_BY_ID, ROWS } from "@/lib/content";
import { addDays, dayKey } from "@/lib/dates";
import { DISCIPLINE_LABEL } from "@/lib/disciplines";
import { counts, currentStreak } from "@/lib/progress";
import { useAppState } from "@/lib/store";

// Demo classmates. Real seminar groups need accounts and a shared database (a later step).
const DEMO = [
  { name: "Kofi A.", streak: 41, week: 7, spoke: true },
  { name: "Jun O.", streak: 30, week: 7, spoke: true },
  { name: "Wei L.", streak: 26, week: 6, spoke: true },
  { name: "Sara R.", streak: 19, week: 6, spoke: true },
  { name: "Priya N.", streak: 15, week: 5, spoke: false },
  { name: "Tomás M.", streak: 12, week: 4, spoke: true },
  { name: "Lena H.", streak: 9, week: 4, spoke: false },
  { name: "Omar S.", streak: 6, week: 3, spoke: true },
];
const GROUP_SIZE = 14;

function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function GroupPage() {
  const state = useAppState();
  const [tab, setTab] = useState<"streaks" | "week">("streaks");

  if (!state) return <Loading />;
  if (!state.profile) return <Onboarding />;
  const { profile, sessions } = state;
  const today = dayKey();
  const streak = currentStreak(profile, sessions);
  const weekDays = new Set(sessions.filter((s) => counts(s) && s.date >= addDays(today, -6)).map((s) => s.date));
  const wroteToday = sessions.some((s) => s.date === today && counts(s));

  const me = { name: `${profile.name.split(/\s+/)[0]} (you)`, initials: initials(profile.name), streak, week: weekDays.size, spoke: wroteToday, me: true };
  const people = [...DEMO.map((d) => ({ ...d, initials: initials(d.name), me: false })), me];
  const sorted = [...people].sort((a, b) => (tab === "streaks" ? b.streak - a.streak : b.week - a.week || b.streak - a.streak));
  const spokeCount = DEMO.filter((d) => d.spoke).length + (wroteToday ? 1 : 0);

  const focus = FOCUS_BY_ID[profile.focus.id];
  const myPhrases = [
    ...new Set(
      sessions
        .filter((s) => s.date >= addDays(today, -6) && s.focusId === focus.id && s.feedback)
        .flatMap((s) => s.feedback!.focusPhrasesUsed.map((p) => p.toLowerCase())),
    ),
  ];

  return (
    <AppShell>
      <main className="container">
        <div className="row between wrap g16" style={{ alignItems: "flex-end" }}>
          <div className="stack g6">
            <p className="eyebrow">Your seminar group</p>
            <h1 className="h1">{profile.group}</h1>
            <p className="small" style={{ fontSize: 14 }}>{GROUP_SIZE} students · {DISCIPLINE_LABEL[profile.discipline] ?? "General"}</p>
          </div>
        </div>

        <div className="notice">
          <strong style={{ color: "var(--ink)" }}>Demo group.</strong> Your own streak is real. The classmates here are examples until shared seminar groups are switched on.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 400px", gap: 24, alignItems: "start" }}>
          <section className="card" aria-label="Leaderboard" style={{ gap: 8 }}>
            <div className="row between wrap g8">
              <h2 className="h3">Leaderboard</h2>
              <div role="group" aria-label="Leaderboard view" className="row g6">
                {(["streaks", "week"] as const).map((t) => (
                  <button key={t} className="chip" aria-pressed={tab === t} onClick={() => setTab(t)}>
                    {t === "streaks" ? "Streaks" : "This week"}
                  </button>
                ))}
              </div>
            </div>
            <div className="stack">
              {sorted.map((p, i) => {
                const rank = tab === "streaks" ? i + 1 : 1 + people.filter((q) => q.week > p.week).length;
                return (
                  <div
                    key={p.name}
                    className="row g12"
                    style={{ minHeight: 54, borderRadius: 12, padding: "0 10px", background: p.me ? "var(--amber-tint)" : "transparent", borderBottom: p.me ? "none" : "1px solid var(--line)" }}
                  >
                    <span style={{ width: 22, fontSize: 13, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{rank}</span>
                    <span className="round-btn avatar" style={{ width: 34, height: 34, cursor: "default" }} aria-hidden="true">{p.initials}</span>
                    <span className="grow" style={{ fontSize: 15, fontWeight: p.me ? 600 : 400 }}>{p.name}</span>
                    {p.spoke && (
                      <span role="img" aria-label="Wrote today">
                        <Check size={16} color="var(--blue)" strokeWidth={2.4} />
                      </span>
                    )}
                    <span className="num" style={{ minWidth: 60, textAlign: "right", fontSize: 22 }}>
                      {tab === "streaks" ? p.streak : `${p.week}/7`}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="small">
              {tab === "streaks" ? "Everyone keeping a streak is building the habit." : "Days written in the last 7. Everyone who writes every day shares first place."}
            </p>
          </section>

          <aside className="stack g16">
            <section className="card" aria-label="Group goal">
              <div className="row between" style={{ alignItems: "baseline" }}>
                <strong style={{ fontSize: 15 }}>Everyone writes today</strong>
                <span style={{ fontSize: 14, color: "var(--blue)", fontWeight: 600 }}>{spokeCount} of {GROUP_SIZE}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${GROUP_SIZE}, minmax(0, 1fr))`, gap: 4 }} aria-hidden="true">
                {Array.from({ length: GROUP_SIZE }, (_, i) => (
                  <span key={i} style={{ height: 8, borderRadius: 4, background: i < spokeCount ? "var(--chart-blue)" : "var(--line)" }} />
                ))}
              </div>
              <p className="small">When all {GROUP_SIZE} write on the same day, the group streak grows.</p>
            </section>

            <section className="card blue" aria-label="Compare notes">
              <span className="eyebrow blue">Compare notes · {ROWS[focus.row].label}</span>
              <span style={{ fontSize: 15, lineHeight: 1.4, color: "var(--blue-strong)" }}>Language you’ve used for {focus.label.toLowerCase()} this week</span>
              {wroteToday ? (
                myPhrases.length ? (
                  <div className="row g8 wrap">
                    {myPhrases.map((p) => (
                      <span key={p} className="serif" style={{ fontStyle: "italic", fontSize: 16, background: "var(--card)", borderRadius: 16, padding: "6px 12px" }}>
                        {p}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="small" style={{ color: "var(--blue)" }}>None yet. Your focus examples are on the Today screen.</p>
                )
              ) : (
                <p className="small" style={{ color: "var(--blue)" }}>Opens once you’ve written today.</p>
              )}
              <p className="small" style={{ color: "var(--blue)" }}>
                When groups are live, you’ll see your classmates’ phrases too, and read two anonymous paragraphs on the same question to pick the clearer one.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
