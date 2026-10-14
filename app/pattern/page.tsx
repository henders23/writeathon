"use client";

import { useState } from "react";
import { Share } from "@/components/Icons";
import Loading from "@/components/Loading";
import Onboarding from "@/components/Onboarding";
import TabBar from "@/components/TabBar";
import { FOCUS_BY_ID, ROWS, type RowId } from "@/lib/content";
import { parseDay } from "@/lib/dates";
import {
  MILESTONES,
  bestStreak,
  counts,
  currentStreak,
  focusChips,
  freezesAvailable,
  patternRows,
  sessionsWithFeedback,
  weeklyRecap,
  type RowStatus,
} from "@/lib/progress";
import { useAppState } from "@/lib/store";

const statusClass: Record<RowStatus, string> = {
  Strength: "strength",
  Improving: "develop",
  Developing: "develop",
  Steady: "steady",
  "Not enough yet": "steady",
};

export default function PatternPage() {
  const state = useAppState();
  const [picked, setPicked] = useState<RowId | null>(null);
  const [shared, setShared] = useState(false);

  if (!state) return <Loading />;
  if (!state.profile) return <Onboarding />;
  const { profile, sessions } = state;

  const rows = patternRows(profile, sessions);
  const withFb = sessionsWithFeedback(sessions);
  const counted = sessions.filter(counts);
  const sel = picked ?? FOCUS_BY_ID[profile.focus.id]?.row ?? "organisation";
  const selRow = rows.find((r) => r.row === sel)!;
  const chips = focusChips(sel, profile, sessions);
  const recap = weeklyRecap(profile, sessions);
  const streak = currentStreak(profile, sessions);
  const best = Math.max(bestStreak(profile, sessions), streak);
  const nextMilestone = MILESTONES.find((m) => m.days > best);
  const freezes = freezesAvailable(profile, sessions);
  const since = counted[0] ? parseDay(counted[0].date).toLocaleDateString("en-GB", { day: "numeric", month: "long" }) : null;

  async function shareRecap() {
    if (!recap) return;
    const text = recap.thenNow
      ? `Week ${recap.weekNumber} on Writeathon. My ${recap.thenNow.focusLabel.toLowerCase()}: then “${recap.thenNow.then}”, now “${recap.thenNow.now}”`
      : `Week ${recap.weekNumber} on Writeathon: ${recap.paragraphs} paragraphs, ${recap.words} words.`;
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setShared(true);
      }
    } catch {
      /* cancelled */
    }
  }

  return (
    <main className="shell">
      <div className="page with-tabs">
        <div className="stack gap-4">
          <h1 className="h1">Your pattern</h1>
          <p className="small" style={{ fontSize: 14 }}>
            {counted.length === 0
              ? "Your pattern builds up as you write paragraphs."
              : `${counted.length} paragraph${counted.length === 1 ? "" : "s"}${since ? ` since ${since}` : ""}`}
          </p>
        </div>

        <section className="card" style={{ padding: 16, gap: 12 }} aria-label="Pattern across your recent paragraphs">
          <div className="row gap-14" style={{ flexWrap: "wrap", fontSize: 12, color: "var(--ink-3)" }}>
            <span className="row gap-6"><span className="cell-s" style={{ width: 10, height: 10 }} />Shown well</span>
            <span className="row gap-6"><span className="cell-g" style={{ width: 7, height: 7 }} />Gap noticed</span>
            <span className="row gap-6"><span className="cell-n" />Not tested</span>
          </div>
          <div className="stack gap-2">
            {rows.map((r) => (
              <button key={r.row} className="pattern-row" aria-pressed={r.row === sel} onClick={() => setPicked(r.row)}>
                <span className="pattern-label">{ROWS[r.row].label}</span>
                <span className="pattern-cells" aria-hidden="true">
                  {r.cells.map((c, i) => (
                    <span key={i} className={c === "S" ? "cell-s" : c === "G" ? "cell-g" : c === "N" ? "cell-n" : "cell-empty"} />
                  ))}
                </span>
                <span className="sr-only">{r.status}</span>
              </button>
            ))}
          </div>
          <div className="row between small" style={{ paddingLeft: 108, fontSize: 11 }}>
            <span>{withFb.length >= 12 ? "12 paragraphs ago" : "Earlier"}</span>
            <span>Latest</span>
          </div>
          <div className="stack gap-10" style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
            <div className="row gap-8">
              <span style={{ fontSize: 15, fontWeight: 600 }}>{ROWS[sel].label}</span>
              <span className={`pill ${statusClass[selRow.status]}`}>{selRow.status}</span>
            </div>
            <p className="body" style={{ fontSize: 14 }}>{selRow.note}</p>
            <p className="eyebrow">Focus areas inside {ROWS[sel].label}</p>
            <div className="row gap-6" style={{ flexWrap: "wrap" }}>
              {chips.map((c) => (
                <span key={c.id} className={`chip ${c.kind === "neutral" ? "" : c.kind}`}>{c.label}</span>
              ))}
            </div>
          </div>
        </section>

        {recap && (
          <section className="card ink" aria-label="Weekly recap">
            <div className="row between">
              <span className="eyebrow amber" style={{ color: "var(--night-amber)" }}>Week {recap.weekNumber} recap</span>
              <button className="icon-btn" style={{ background: "transparent", borderColor: "var(--night-edge)", color: "var(--night-text)" }} aria-label="Share recap" onClick={shareRecap}>
                <Share />
              </button>
            </div>
            <p className="serif" style={{ margin: 0, fontSize: 26, lineHeight: 1.2 }}>{recap.headline}</p>
            {recap.thenNow ? (
              <div className="stack gap-8">
                <div className="card night" style={{ padding: "10px 12px", gap: 2, border: "1px solid var(--night-line)" }}>
                  <span className="eyebrow">Then</span>
                  <span className="serif" style={{ fontSize: 16 }}>“{recap.thenNow.then}”</span>
                </div>
                <div className="card night" style={{ padding: "10px 12px", gap: 2, border: "1px solid var(--night-amber)" }}>
                  <span className="eyebrow amber">Now</span>
                  <span className="serif" style={{ fontSize: 16 }}>“{recap.thenNow.now}”</span>
                </div>
              </div>
            ) : null}
            {recap.fluency && (
              <div className="row gap-12" style={{ borderTop: "1px solid var(--night-line)", paddingTop: 12 }}>
                <span className="serif" style={{ fontSize: 30, lineHeight: 1 }}>{recap.fluency.now}</span>
                <span className="small" style={{ color: "var(--night-soft)" }}>
                  words per 5 minutes this week, {recap.fluency.now > recap.fluency.then ? "up from" : "compared with"} {recap.fluency.then} in your first week
                </span>
              </div>
            )}
            <p className="small" style={{ color: "var(--night-muted)" }}>
              {recap.paragraphs} paragraph{recap.paragraphs === 1 ? "" : "s"} and {recap.words} words in the last 7 days.
              {shared ? " Copied to clipboard." : ""}
            </p>
          </section>
        )}

        <section className="stack gap-12" aria-labelledby="milestones">
          <h2 id="milestones" className="eyebrow" style={{ fontWeight: 600 }}>Milestones</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
            {MILESTONES.map((m) => {
              const earned = best >= m.days;
              const isNext = !earned && m === nextMilestone;
              return (
                <div key={m.days} className="stack gap-6" style={{ alignItems: "center" }}>
                  <span className={`badge ${earned ? "earned" : isNext ? "next" : "locked"}`}>{m.days}</span>
                  <span style={{ fontSize: 12, color: isNext ? "var(--amber-text)" : "var(--ink-3)", fontWeight: isNext ? 600 : 400 }}>
                    {isNext ? `${m.days - streak} to go` : m.label}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="small">
            You earn a streak freeze for every 7 days you write (up to 2 saved). {freezes} saved.
          </p>
        </section>
      </div>
      <TabBar />
    </main>
  );
}
