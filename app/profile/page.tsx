"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Loading from "@/components/Loading";
import Onboarding from "@/components/Onboarding";
import { FOCUSES, ROWS } from "@/lib/content";
import { dayKey } from "@/lib/dates";
import { DISCIPLINES } from "@/lib/disciplines";
import { clearSampleHistory, loadSampleHistory } from "@/lib/sample";
import { resetAll, saveProfile, useAppState } from "@/lib/store";

type Theme = "light" | "dark" | "system";

function ThemeChoice() {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    setTheme(attr === "dark" || attr === "light" ? attr : "system");
  }, []);
  function choose(t: Theme) {
    setTheme(t);
    if (t === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
    try {
      if (t === "system") localStorage.removeItem("writeathon.theme");
      else localStorage.setItem("writeathon.theme", t);
    } catch {
      /* storage blocked: the choice lasts for this visit */
    }
  }
  return (
    <div role="group" aria-label="Theme" className="row g8 wrap">
      {(["light", "dark", "system"] as const).map((t) => (
        <button key={t} type="button" className="chip" aria-pressed={theme === t} onClick={() => choose(t)}>
          {t === "light" ? "Light" : t === "dark" ? "Dark" : "Match my device"}
        </button>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const state = useAppState();
  const [confirmReset, setConfirmReset] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!state) return <Loading />;
  if (!state.profile) return <Onboarding />;
  const p = state.profile;
  const hasSample = state.sessions.some((s) => s.sample);

  return (
    <AppShell>
      <main className="container mid">
        <div className="stack g6">
          <p className="eyebrow">Profile and settings</p>
          <h1 className="h1">{p.name}</h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)", gap: 24, alignItems: "start" }}>
          <form
            className="panel stack g20"
            style={{ padding: 28 }}
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              saveProfile({
                ...p,
                name: String(f.get("name") || p.name).trim(),
                discipline: String(f.get("discipline") || p.discipline),
                group: String(f.get("group") || p.group).trim(),
                accessCode: String(f.get("code") || "").trim() || undefined,
                focus: f.get("focus") && f.get("focus") !== p.focus.id ? { id: String(f.get("focus")), since: dayKey() } : p.focus,
              });
              setSaved(true);
            }}
            onChange={() => setSaved(false)}
          >
            <h2 className="h2" style={{ fontSize: 22 }}>You</h2>
            <div className="grid2">
              <div className="field">
                <label htmlFor="name">First name</label>
                <input id="name" name="name" defaultValue={p.name} />
              </div>
              <div className="field">
                <label htmlFor="discipline">Subject</label>
                <select id="discipline" name="discipline" defaultValue={p.discipline}>
                  {DISCIPLINES.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid2">
              <div className="field">
                <label htmlFor="group">Seminar group</label>
                <input id="group" name="group" defaultValue={p.group} />
              </div>
              <div className="field">
                <label htmlFor="code">Access code</label>
                <input id="code" name="code" defaultValue={p.accessCode ?? ""} autoComplete="off" />
                <span className="hint">Only needed if your tutor gave you one.</span>
              </div>
            </div>
            <div className="field">
              <label htmlFor="focus">Current focus</label>
              <select id="focus" name="focus" defaultValue={p.focus.id}>
                {FOCUSES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {ROWS[f.row].label} · {f.label}
                  </option>
                ))}
              </select>
              <span className="hint">The app chooses this from your progress. Change it here if you or your tutor want something else.</span>
            </div>
            <div className="row g12">
              <button className="btn" type="submit">Save changes</button>
              {saved && <span className="small" role="status">Saved.</span>}
            </div>
          </form>

          <aside className="stack g16">
            <section className="card">
              <h2 className="h3">Appearance</h2>
              <ThemeChoice />
            </section>

            <section className="card">
              <h2 className="h3">How feedback works</h2>
              <p className="body" style={{ fontSize: 14 }}>What you ask for, how notes appear in the margin, and how banked sentences come back.</p>
              <Link href="/how" className="btn secondary small" style={{ alignSelf: "flex-start" }}>See how feedback works</Link>
            </section>

            <section className="card">
              <h2 className="h3">Demo</h2>
              <p className="body" style={{ fontSize: 14 }}>Fill the app with three weeks of sample paragraphs, to show how progress, the bank and streaks build up.</p>
              {hasSample ? (
                <button type="button" className="btn secondary small" style={{ alignSelf: "flex-start" }} onClick={clearSampleHistory}>Remove sample history</button>
              ) : (
                <button type="button" className="btn secondary small" style={{ alignSelf: "flex-start" }} onClick={loadSampleHistory}>Load sample history</button>
              )}
            </section>

            <section className="card">
              <h2 className="h3">Your data</h2>
              <p className="body" style={{ fontSize: 14 }}>
                Everything is stored in this browser on this device. Clearing your browser data, or using another device, starts you afresh.
              </p>
              {confirmReset ? (
                <div className="row g8 wrap">
                  <button type="button" className="btn secondary small" onClick={() => setConfirmReset(false)}>Cancel</button>
                  <button type="button" className="btn small" style={{ background: "var(--danger)", color: "var(--card)" }} onClick={resetAll}>Delete everything</button>
                </div>
              ) : (
                <button type="button" className="btn secondary small" style={{ alignSelf: "flex-start" }} onClick={() => setConfirmReset(true)}>Delete all my data</button>
              )}
            </section>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
