"use client";

import { useEffect, useState } from "react";
import { getConfig } from "@/lib/api";
import { FIRST_FOCUS } from "@/lib/content";
import { dayKey } from "@/lib/dates";
import { DISCIPLINES } from "@/lib/disciplines";
import { saveProfile } from "@/lib/store";

export default function Onboarding() {
  const [name, setName] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [group, setGroup] = useState("");
  const [code, setCode] = useState("");
  const [needsCode, setNeedsCode] = useState(false);

  useEffect(() => {
    getConfig()
      .then((c) => setNeedsCode(c.accessCodeRequired))
      .catch(() => {});
  }, []);

  const ready = name.trim().length > 0 && discipline !== "" && (!needsCode || code.trim().length > 0);

  return (
    <main className="shell">
      <form
        className="page"
        onSubmit={(e) => {
          e.preventDefault();
          if (!ready) return;
          saveProfile({
            name: name.trim(),
            discipline,
            group: group.trim() || "My seminar group",
            accessCode: code.trim() || undefined,
            createdAt: new Date().toISOString(),
            focus: { id: FIRST_FOCUS, since: dayKey() },
            frozenDates: [],
          });
        }}
      >
        <div className="wordmark" style={{ marginTop: 24 }}>Writeathon</div>
        <div className="stack gap-10">
          <h1 className="h1">Ten minutes of academic writing a day.</h1>
          <p className="body">
            Each day you&apos;ll write one paragraph on a question from your subject, sometimes using a very short source. Then you get
            one thing that went well, one sentence to rewrite, and a growing picture of your strengths.
          </p>
        </div>
        <div className="field">
          <label htmlFor="name">Your first name</label>
          <input id="name" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="discipline">Your subject</label>
          <select id="discipline" value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
            <option value="" disabled>
              Choose your subject
            </option>
            {DISCIPLINES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
          <span className="hint">Your daily questions come from this subject. You can change it later.</span>
        </div>
        <div className="field">
          <label htmlFor="group">Seminar group</label>
          <input id="group" placeholder="e.g. Engineering EAP Group 2" value={group} onChange={(e) => setGroup(e.target.value)} />
        </div>
        {needsCode && (
          <div className="field">
            <label htmlFor="code">Access code</label>
            <input id="code" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} />
            <span className="hint">Your tutor will give you this.</span>
          </div>
        )}
        <p className="small">
          Your progress is saved in this browser on this device. Your writing is sent to OpenAI to write your feedback.
        </p>
        <button className="btn" type="submit" disabled={!ready}>
          Start
        </button>
      </form>
    </main>
  );
}
