"use client";

import Link from "next/link";
import { useState } from "react";
import { Close } from "@/components/Icons";
import Loading from "@/components/Loading";
import Onboarding from "@/components/Onboarding";
import { FOCUSES, ROWS } from "@/lib/content";
import { dayKey } from "@/lib/dates";
import { DISCIPLINES } from "@/lib/disciplines";
import { clearSampleHistory, loadSampleHistory } from "@/lib/sample";
import { resetAll, saveProfile, useAppState } from "@/lib/store";

export default function ProfilePage() {
  const state = useAppState();
  const [confirmReset, setConfirmReset] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!state) return <Loading />;
  if (!state.profile) return <Onboarding />;
  const p = state.profile;
  const hasSample = state.sessions.some((s) => s.sample);

  return (
    <main className="shell">
      <form
        className="page"
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
      >
        <div className="row between">
          <h1 className="h1" style={{ fontSize: 28 }}>You</h1>
          <Link href="/" className="icon-btn" aria-label="Close">
            <Close />
          </Link>
        </div>
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
          <span className="hint">Your daily questions come from this subject.</span>
        </div>
        <div className="field">
          <label htmlFor="group">Seminar group</label>
          <input id="group" name="group" defaultValue={p.group} />
        </div>
        <div className="field">
          <label htmlFor="code">Access code</label>
          <input id="code" name="code" defaultValue={p.accessCode ?? ""} autoComplete="off" />
          <span className="hint">Only needed if your tutor gave you one.</span>
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
          <span className="hint">The app chooses this from your pattern. Change it here if you or your tutor want something else.</span>
        </div>
        <button className="btn" type="submit">Save</button>
        {saved && <p className="small" role="status">Saved.</p>}

        <div className="stack gap-10" style={{ borderTop: "1px solid var(--line)", paddingTop: 20 }}>
          <h2 className="eyebrow" style={{ fontWeight: 600 }}>Demo</h2>
          <p className="small">Fill the app with three weeks of sample paragraphs, to show how the pattern, bank and streaks build up.</p>
          {hasSample ? (
            <button type="button" className="btn secondary" onClick={clearSampleHistory}>Remove sample history</button>
          ) : (
            <button type="button" className="btn secondary" onClick={loadSampleHistory}>Load sample history</button>
          )}
        </div>

        <div className="stack gap-10" style={{ borderTop: "1px solid var(--line)", paddingTop: 20 }}>
          <h2 className="eyebrow" style={{ fontWeight: 600 }}>Your data</h2>
          <p className="small">
            Everything is stored in this browser on this device. Clearing your browser data, or using another device, starts you afresh.
          </p>
          {confirmReset ? (
            <div className="row gap-8">
              <button type="button" className="btn secondary" style={{ minHeight: 48 }} onClick={() => setConfirmReset(false)}>Cancel</button>
              <button type="button" className="btn" style={{ minHeight: 48, background: "#7A2A1A" }} onClick={resetAll}>Delete everything</button>
            </div>
          ) : (
            <button type="button" className="btn secondary" onClick={() => setConfirmReset(true)}>Delete all my data</button>
          )}
        </div>
      </form>
    </main>
  );
}
