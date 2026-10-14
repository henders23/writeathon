"use client";

import { useState } from "react";
import { postJSON } from "@/lib/api";
import { dayKey } from "@/lib/dates";
import { addToBank, newId, patchSession } from "@/lib/store";
import type { Session, WorkOn } from "@/lib/types";
import { Bookmark, Check } from "./Icons";

type Verdict = { ok: boolean; comment: string };

const HINTS: { key: "clue" | "pattern" | "try"; label: string; button: string }[] = [
  { key: "clue", label: "Clue", button: "Give me a clue" },
  { key: "pattern", label: "The pattern", button: "Show me the pattern" },
  { key: "try", label: "One possible version", button: "Show me a version" },
];

/** "Rewrite it": the student revises one sentence, with hints that step up, then banks it. */
export default function RewriteIt({ session, workOn }: { session: Session; workOn: WorkOn }) {
  const last = session.rewrites?.[session.rewrites.length - 1];
  const [attempt, setAttempt] = useState(last?.text ?? workOn.said);
  const [level, setLevel] = useState(last?.hintLevel ?? 0);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<Verdict | null>(last ? { ok: last.ok, comment: last.comment } : null);
  const [error, setError] = useState<string | null>(null);
  const banked = Boolean(session.banked);
  const unchanged = attempt.trim() === workOn.said.trim();

  async function check() {
    setError(null);
    setChecking(true);
    try {
      const v = await postJSON<Verdict>("/api/rewrite", {
        label: workOn.label,
        clue: workOn.clue,
        original: workOn.said,
        model: workOn.try,
        attempt,
        hintLevel: level,
      });
      setResult(v);
      patchSession(session.id, (s) => ({ rewrites: [...(s.rewrites ?? []), { text: attempt.trim(), ok: v.ok, comment: v.comment, hintLevel: level }] }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't check that.");
    }
    setChecking(false);
  }

  function bank() {
    addToBank({
      id: newId(),
      date: dayKey(),
      sessionId: session.id,
      row: workOn.row,
      focusId: workOn.focusId,
      label: workOn.label,
      before: workOn.said,
      after: attempt.trim(),
      reused: 0,
    });
    patchSession(session.id, { banked: true });
  }

  return (
    <div className="stack gap-12">
      <div className="field">
        <label htmlFor="rewrite" style={{ color: "var(--amber-deep)" }}>Rewrite it: edit your sentence</label>
        <textarea
          id="rewrite"
          rows={4}
          value={attempt}
          onChange={(e) => setAttempt(e.target.value)}
          onPaste={(e) => e.preventDefault()}
          disabled={banked}
          style={{ fontFamily: "var(--serif)", fontSize: 18, lineHeight: 1.4 }}
        />
      </div>

      {HINTS.slice(0, level).map((h) => (
        <div key={h.key} className="hint-step">
          <p className="eyebrow amber">{h.label}</p>
          <span className={h.key === "clue" ? "" : "serif"} style={h.key === "clue" ? undefined : { fontSize: 17 }}>
            {h.key === "clue" ? workOn.clue : `“${workOn[h.key]}”`}
          </span>
        </div>
      ))}

      {!banked && (
        <div className="stack gap-8">
          <button className="btn outline-amber" onClick={check} disabled={checking || unchanged || !attempt.trim()}>
            {checking ? "Checking…" : unchanged ? "Change your sentence, then check it" : result && !result.ok ? "Check again" : "Check my rewrite"}
          </button>
          {level < HINTS.length && !(result?.ok) && (
            <button className="text-btn" style={{ fontSize: 14, minHeight: 36, color: "var(--amber-deep)", alignSelf: "flex-start" }} onClick={() => setLevel((l) => l + 1)}>
              {HINTS[level].button}
            </button>
          )}
        </div>
      )}

      {result && (
        <p className="body" aria-live="polite" style={{ color: result.ok ? "var(--blue)" : "var(--ink-2)", fontWeight: 500 }}>
          {result.ok && <Check size={14} color="var(--blue)" />} {result.comment}
        </p>
      )}
      {error && <div className="error" role="alert">{error}</div>}

      {result?.ok && !banked && (
        <button className="btn" onClick={bank}>
          <Bookmark color="var(--card)" size={18} /> Bank this sentence
        </button>
      )}
      {banked && (
        <p className="small row gap-6" role="status" style={{ color: "var(--blue)" }}>
          <Bookmark size={16} color="var(--blue)" /> Banked. It will come back to you on another day.
        </p>
      )}
    </div>
  );
}
