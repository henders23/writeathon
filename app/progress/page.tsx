"use client";

import Link from "next/link";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import { ChartCard, Dumbbell, HBars, LineChart, Swatch } from "@/components/Charts";
import Loading from "@/components/Loading";
import Onboarding from "@/components/Onboarding";
import { FOCUS_BY_ID, ROWS, ROW_IDS } from "@/lib/content";
import { parseDay } from "@/lib/dates";
import {
  areasThenNow,
  criteriaThenNow,
  levelLabel,
  LEVELS,
  fluencySeries,
  focusGrid,
  headline,
  languageSnapshot,
  moveCounts,
  recallByGap,
  requestsAndCalibration,
  strengthsAndNext,
} from "@/lib/insights";
import { patternRows, weeklyRecap } from "@/lib/progress";
import { useAppState } from "@/lib/store";

const short = (d: string) => parseDay(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const pct = (v: number | null) => (v === null ? "–" : `${Math.round(v * 100)}%`);

export default function ProgressPage() {
  const state = useAppState();
  const [shared, setShared] = useState(false);
  if (!state) return <Loading />;
  if (!state.profile) return <Onboarding />;
  const { profile, sessions } = state;

  const h = headline(state);
  const areas = areasThenNow(sessions);
  const crit = criteriaThenNow(sessions);
  const levelScale = { ticks: LEVELS.map((l, i) => ({ v: i / (LEVELS.length - 1), label: l })), fmt: (v: number) => levelLabel(v * (LEVELS.length - 1)) };
  const toUnit = (v: number | null) => (v === null ? null : Math.max(0, v) / (LEVELS.length - 1));
  const status = Object.fromEntries(patternRows(profile, sessions).map((r) => [r.row, r.status]));
  const sn = strengthsAndNext(sessions);
  const flu = fluencySeries(sessions);
  const moves = moveCounts(sessions);
  const grid = focusGrid(sessions);
  const lang = languageSnapshot(sessions);
  const recall = recallByGap(state);
  const rc = requestsAndCalibration(sessions);
  const recap = weeklyRecap(profile, sessions);
  const focus = FOCUS_BY_ID[profile.focus.id];

  if (h.paragraphs === 0) {
    return (
      <AppShell>
        <main className="container mid">
          <h1 className="h1">Your progress</h1>
          <div className="panel stack g12" style={{ padding: 32 }}>
            <p className="lead">Your dashboard fills in as you write. After your first paragraph you’ll see your five areas; after a week, how they’re changing.</p>
            <Link href="/" className="btn" style={{ alignSelf: "flex-start" }}>Write today’s paragraph</Link>
            <span className="small">Want to see what it looks like? Load sample data from your profile.</span>
          </div>
        </main>
      </AppShell>
    );
  }

  async function share() {
    if (!recap) return;
    const text = recap.thenNow
      ? `Week ${recap.weekNumber} on Writeathon. My ${recap.thenNow.focusLabel.toLowerCase()}: then “${recap.thenNow.then}”, now “${recap.thenNow.now}”`
      : `Week ${recap.weekNumber} on Writeathon: ${recap.paragraphs} paragraphs, ${recap.words} words.`;
    try {
      if (navigator.share) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
      setShared(true);
    } catch {
      /* cancelled */
    }
  }

  return (
    <AppShell>
      <main className="container">
        <div className="row between wrap g16" style={{ alignItems: "flex-end" }}>
          <div className="stack g6">
            <p className="eyebrow">Your progress</p>
            <h1 className="h1">{recap?.headline ?? "How your writing is growing"}</h1>
          </div>
          <span className="small">Current focus: <strong style={{ color: "var(--ink)" }}>{focus?.label}</strong></span>
        </div>

        <section className="grid4" aria-label="Headline numbers" style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}>
          <Tile value={h.paragraphs} label="paragraphs written" />
          <Tile value={h.words.toLocaleString("en-GB")} label="words written" />
          <Tile value={h.streak} label={`day streak · best ${Math.max(h.best, h.streak)}`} />
          <Tile value={h.perFive ?? "–"} label="words per 5 minutes" />
          <Tile value={h.banked} label="sentences banked" />
          <Tile value={h.dictionary} label={`words collected · ${h.mastered} mastered`} />
        </section>

        {recap?.thenNow && (
          <section className="card amber" aria-label="Then and now">
            <div className="row between wrap g8">
              <span className="eyebrow amber">Week {recap.weekNumber} · {recap.thenNow.focusLabel}: then and now</span>
              <button className="text-btn" onClick={share}>{shared ? "Copied" : "Share"}</button>
            </div>
            <div className="grid2">
              <div className="stack g4">
                <span className="small">Then</span>
                <p className="bank-before" style={{ fontSize: 18 }}>“{recap.thenNow.then}”</p>
              </div>
              <div className="stack g4">
                <span className="small" style={{ color: "var(--amber-text)", fontWeight: 600 }}>Now</span>
                <p className="bank-after" style={{ fontSize: 19 }}>“{recap.thenNow.now}”</p>
              </div>
            </div>
          </section>
        )}

        <div className="grid3" style={{ alignItems: "start" }}>
          {crit.rows.length > 0 && (
            <ChartCard
              span={2}
              title="How effective your writing is: then and now"
              subtitle="Indicative CEFR-aligned levels for each criterion, averaged over your first paragraphs and your latest ones. Effectiveness first; language last."
              legend={
                <>
                  <span><Swatch color="var(--chart-blue-light)" />Your first paragraphs</span>
                  <span><Swatch color="var(--chart-blue)" />Your latest paragraphs</span>
                </>
              }
              table={
                <table className="table-view">
                  <thead><tr><th>Criterion</th><th>Then</th><th>Now</th></tr></thead>
                  <tbody>
                    {crit.rows.map((r) => (
                      <tr key={r.id}><td>{r.label}</td><td>{r.then === null ? "–" : levelLabel(r.then)}</td><td>{r.now === null ? "–" : levelLabel(r.now)}</td></tr>
                    ))}
                  </tbody>
                </table>
              }
            >
              <Dumbbell label="Effectiveness criteria, then and now" scale={levelScale} rows={crit.rows.map((r) => ({ label: r.label, then: toUnit(r.then), now: toUnit(r.now) }))} />
              <span className="small">Levels are indicative: each comes from one short timed paragraph, judged against CEFR Companion Volume (2020) scales for written production and mediation.</span>
            </ChartCard>
          )}
          {crit.rows.length > 0 && (
            <section className="card flat">
              <span className="eyebrow">What “effective” means here</span>
              <span className="body" style={{ fontSize: 14 }}>
                Feedback judges how well your paragraph does its job for its reader: answering the question, making each move count, connecting ideas, using and combining sources, and making claims as strong as the evidence. Language matters as far as it helps or blocks that.
              </span>
            </section>
          )}
          <ChartCard
            span={2}
            title="Your five areas: then and now"
            subtitle="How often each area was shown well, in your first paragraphs and your latest ones"
            legend={
              <>
                <span><Swatch color="var(--chart-blue-light)" />Your first paragraphs</span>
                <span><Swatch color="var(--chart-blue)" />Your latest paragraphs</span>
              </>
            }
            table={
              <table className="table-view">
                <thead><tr><th>Area</th><th>Then</th><th>Now</th><th>Times tested</th><th>Status</th></tr></thead>
                <tbody>
                  {areas.map((a) => (
                    <tr key={a.row}><td>{a.label}</td><td>{pct(a.then)}</td><td>{pct(a.now)}</td><td>{a.tested}</td><td>{status[a.row]}</td></tr>
                  ))}
                </tbody>
              </table>
            }
          >
            <Dumbbell rows={areas.map((a) => ({ label: a.label, then: a.then, now: a.now }))} />
            <div className="row g8 wrap">
              {areas.map((a) => (
                <span key={a.row} className={`pill ${status[a.row] === "Strength" ? "blue" : status[a.row] === "Developing" ? "amber" : status[a.row] === "Improving" ? "blue" : "grey"}`}>
                  {a.label}: {status[a.row]}
                </span>
              ))}
            </div>
          </ChartCard>

          <section className="stack g16">
            <div className="card blue">
              <span className="eyebrow blue">You do these well</span>
              {sn.strengths.length === 0 && <span className="body" style={{ fontSize: 14 }}>Your strengths will appear here after a few paragraphs.</span>}
              {sn.strengths.map((s) => (
                <div key={s.label} className="stack g4">
                  <strong style={{ fontSize: 14, color: "var(--blue-strong)" }}>{s.label} <span className="small">· {s.area}</span></strong>
                  {s.quote && <span className="serif" style={{ fontStyle: "italic", fontSize: 15 }}>“{s.quote}”</span>}
                </div>
              ))}
            </div>
            <div className="card amber">
              <span className="eyebrow amber">Where to grow next</span>
              {sn.next.length === 0 && <span className="body" style={{ fontSize: 14 }}>Nothing yet.</span>}
              {sn.next.map((s) => (
                <div key={s.label} className="stack g4">
                  <strong style={{ fontSize: 14 }}>{s.label} <span className="small">· {s.area}</span></strong>
                  <span className="body" style={{ fontSize: 13 }}>{s.comment}</span>
                </div>
              ))}
            </div>
          </section>

          <ChartCard
            span={2}
            title="Writing fluency"
            subtitle="Words per five minutes of writing. More words in the same time means ideas come more easily."
            table={
              <table className="table-view">
                <thead><tr><th>Date</th><th>Words per 5 min</th><th>Words</th></tr></thead>
                <tbody>{flu.map((p, i) => <tr key={i}><td>{short(p.date)}</td><td>{p.value}</td><td>{p.words}</td></tr>)}</tbody>
              </table>
            }
          >
            {flu.length >= 2 ? (
              <LineChart points={flu.map((p) => ({ x: short(p.date), y: p.value }))} unit="words per 5 min" label="Words per five minutes over time" />
            ) : (
              <p className="body" style={{ fontSize: 14 }}>Write two paragraphs to see your fluency line.</p>
            )}
          </ChartCard>

          <ChartCard
            title="Language snapshot"
            subtitle={lang.enough ? "Your first paragraphs compared with your latest" : "Needs four paragraphs"}
            table={
              <table className="table-view">
                <thead><tr><th>Measure</th><th>Then</th><th>Now</th></tr></thead>
                <tbody>
                  <tr><td>Hedges per 100 words</td><td>{lang.then.hedges.toFixed(1)}</td><td>{lang.now.hedges.toFixed(1)}</td></tr>
                  <tr><td>Words per sentence</td><td>{lang.then.sentence.toFixed(1)}</td><td>{lang.now.sentence.toFixed(1)}</td></tr>
                  <tr><td>Different reporting verbs</td><td>{lang.then.reportingVariety}</td><td>{lang.now.reportingVariety}</td></tr>
                </tbody>
              </table>
            }
          >
            {lang.enough ? (
              <div className="stack g12">
                <Measure label="Hedges per 100 words" then={lang.then.hedges} now={lang.now.hedges} note="1–3 is typical of academic writing" />
                <Measure label="Words per sentence" then={lang.then.sentence} now={lang.now.sentence} note="Around 18–25 reads well" />
                <Measure label="Different reporting verbs" then={lang.then.reportingVariety} now={lang.now.reportingVariety} digits={0} />
              </div>
            ) : (
              <p className="body" style={{ fontSize: 14 }}>Write a few more paragraphs to compare.</p>
            )}
          </ChartCard>

          <ChartCard
            span={2}
            title="Focus by focus"
            subtitle={`The ${grid.rows.length} focuses across your last ${grid.dates.length} paragraphs`}
            legend={
              <>
                <span><span className="cell-s" style={{ width: 10, height: 10 }} />Used well</span>
                <span><span className="cell-g" style={{ width: 10, height: 10 }} />Gap noticed</span>
                <span><span className="cell-n" />Not tested</span>
              </>
            }
            table={
              <table className="table-view">
                <thead><tr><th>Focus</th>{grid.dates.map((d, i) => <th key={i}>{short(d)}</th>)}</tr></thead>
                <tbody>
                  {grid.rows.map((r) => (
                    <tr key={r.id}><td>{r.label}</td>{r.cells.map((c, i) => <td key={i}>{c === "S" ? "Well" : c === "G" ? "Gap" : ""}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            }
          >
            <div className="stack g12">
              {ROW_IDS.map((row) => (
                <div key={row} className="stack g4">
                  <span className="eyebrow">{ROWS[row].label}</span>
                  {grid.rows.filter((r) => r.row === row).map((r) => (
                    <div key={r.id} style={{ display: "grid", gridTemplateColumns: `200px repeat(${Math.max(1, grid.dates.length)}, 22px)`, alignItems: "center", gap: 4 }}>
                      <span className="small" style={{ color: r.id === profile.focus.id ? "var(--amber-text)" : "var(--ink-2)", fontWeight: r.id === profile.focus.id ? 600 : 400 }}>
                        {r.label}{r.id === profile.focus.id ? " · now" : ""}
                      </span>
                      {r.cells.map((c, i) => (
                        <span key={i} title={`${r.label}, ${short(grid.dates[i])}: ${c === "S" ? "used well" : c === "G" ? "gap noticed" : "not tested"}`} style={{ display: "flex", justifyContent: "center" }}>
                          <span className={c === "S" ? "cell-s" : c === "G" ? "cell-g" : "cell-n"} />
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </ChartCard>

          <section className="stack g16">
            <ChartCard
              title="Paragraph moves you use"
              subtitle={moves.planMatch !== null ? `You followed your plan in ${pct(moves.planMatch)} of sentences` : "From your marked paragraphs"}
              table={
                <table className="table-view">
                  <thead><tr><th>Move</th><th>Sentences</th></tr></thead>
                  <tbody>{moves.rows.map((m) => <tr key={m.move}><td>{m.label}</td><td>{m.count}</td></tr>)}</tbody>
                </table>
              }
            >
              <HBars rows={moves.rows.filter((m) => m.count > 0).sort((a, b) => b.count - a.count).map((m) => ({ label: m.label, value: m.count }))} />
              {moves.rows.filter((m) => m.count === 0).length > 0 && (
                <span className="small">Not tried yet: {moves.rows.filter((m) => m.count === 0).map((m) => m.label).join(", ")}</span>
              )}
            </ChartCard>
          </section>

          <ChartCard
            title="Remembering what you fixed"
            subtitle="Sentences fixed correctly from memory, by days since you last practised them"
            table={
              <table className="table-view">
                <thead><tr><th>Gap</th><th>Correct</th><th>Tries</th></tr></thead>
                <tbody>{recall.map((b) => <tr key={b.gap}><td>{b.gap} day{b.gap === 1 ? "" : "s"}</td><td>{b.ok}</td><td>{b.total}</td></tr>)}</tbody>
              </table>
            }
          >
            {recall.some((b) => b.total) ? (
              <HBars max={1} format={(v) => `${Math.round(v * 100)}%`} rows={recall.filter((b) => b.total).map((b) => ({ label: `${b.gap} day${b.gap === 1 ? "" : "s"}`, value: b.total ? b.ok / b.total : 0, sub: `${b.ok} of ${b.total}` }))} />
            ) : null}
            {recall.some((b) => !b.total) && recall.some((b) => b.total) && (
              <span className="small">Not reached yet: {recall.filter((b) => !b.total).map((b) => `${b.gap} days`).join(", ")}</span>
            )}
            {!recall.some((b) => b.total) && (
              <p className="body" style={{ fontSize: 14 }}>Bank a sentence, then fix it from memory the next day.</p>
            )}
          </ChartCard>

          <ChartCard title="What you ask about" subtitle="Your feedback requests">
            {rc.asked.length ? (
              <HBars color="var(--chart-amber)" rows={rc.asked.slice(0, 6).map((r) => ({ label: r.label, value: r.count }))} />
            ) : (
              <p className="body" style={{ fontSize: 14 }}>Choose what to ask about after you write, and it will show here.</p>
            )}
          </ChartCard>

          <section className="card" aria-label="Knowing your own writing">
            <h2 className="h3">Knowing your own writing</h2>
            <span className="small">When you name the sentence you’re least sure of, how often does your tutor pick the same one?</span>
            {rc.judged ? (
              <>
                <span className="stat">{rc.matched} <span className="small" style={{ fontSize: 16 }}>of {rc.judged}</span></span>
                <span className="body" style={{ fontSize: 14 }}>
                  {rc.matched / rc.judged >= 0.5
                    ? "You often spot your own weak sentence. That’s a key skill for editing alone."
                    : "Your sense of your weakest sentence is still developing. Keep naming one each time."}
                </span>
              </>
            ) : (
              <span className="body" style={{ fontSize: 14 }}>Pick a sentence you’re unsure about after writing to start tracking this.</span>
            )}
          </section>
        </div>
      </main>
    </AppShell>
  );
}

function Tile({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="card tight">
      <span className="stat" style={{ fontSize: 36 }}>{value}</span>
      <span className="small">{label}</span>
    </div>
  );
}

function Measure({ label, then, now, note, digits = 1 }: { label: string; then: number; now: number; note?: string; digits?: number }) {
  const m = Math.max(then, now, 1) * 1.1;
  return (
    <div className="stack g4">
      <div className="row between">
        <span className="small" style={{ color: "var(--ink-2)" }}>{label}</span>
        <span className="small" style={{ fontVariantNumeric: "tabular-nums" }}>{then.toFixed(digits)} → <strong style={{ color: "var(--ink)" }}>{now.toFixed(digits)}</strong></span>
      </div>
      <div style={{ position: "relative", height: 14, background: "var(--paper)", borderRadius: 4 }} aria-hidden="true">
        <span style={{ position: "absolute", left: `${(then / m) * 100}%`, top: 2, width: 10, height: 10, marginLeft: -5, borderRadius: 5, background: "var(--chart-blue-light)" }} />
        <span style={{ position: "absolute", left: `${(now / m) * 100}%`, top: 1, width: 12, height: 12, marginLeft: -6, borderRadius: 6, background: "var(--chart-blue)" }} />
      </div>
      {note && <span className="small" style={{ fontSize: 12 }}>{note}</span>}
    </div>
  );
}
