"use client";

import { useState } from "react";
import { postJSON } from "@/lib/api";
import { dayKey } from "@/lib/dates";
import { REVIEW_INTERVALS } from "@/lib/progress";
import { addToBank, newId, patchSession } from "@/lib/store";
import type { Session, WorkOn } from "@/lib/types";
import { addDays } from "@/lib/dates";
import { Bookmark, Check } from "./Icons";

type Verdict = { ok: boolean; comment: string };

const HINTS: { key: "clue" | "pattern" | "try"; label: string; button: string }[] = [
  { key: "clue", label: "Clue", button: "Give me a clue" },
  { key: "pattern", label: "The pattern", button: "Show me the pattern" },
  { key: "try", label: "One possible version", button: "Show me a version" },
];
const MODEL_SEEN = 3;

/**
 * "Rewrite it": the student revises one sentence, with hints that step up, then banks it.
 * If they saw the model version, they must first use the pattern in a new sentence on another
 * topic, so what gets banked is learning rather than copying.
 */
export default function RewriteIt({ session, workOn }: { session: Session; workOn: WorkOn }) {
  const last = session.rewrites?.[session.rewrites.length - 1];
  const [attempt, setAttempt] = useState(last?.text ?? workOn.said);
  const [level, setLevel] = useState(last?.hintLevel ?? 0);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<Verdict | null>(last ? { ok: last.ok, comment: last.comment } : null);
  const [transfer, setTransfer] = useState("");
  const [transferResult, setTransferResult] = useState<Verdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const banked = Boolean(session.banked);
  const unchanged = attempt.trim() === workOn.said.trim();
  const needsTransfer = level >= MODEL_SEEN;

  async function check() {
    setError(null);
    setChecking(true);
    try {
      const v = await postJSON<Verdict>("/api/rewrite", {
        mode: "rewrite",
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

  async function checkTransfer() {
    setError(null);
    setChecking(true);
    try {
      const v = await postJSON<Verdict>("/api/rewrite", {
        mode: "transfer",
        label: workOn.label,
        pattern: workOn.pattern,
        original: workOn.said,
        model: workOn.try,
        attempt: transfer,
      });
      setTransferResult(v);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't check that.");
    }
    setChecking(false);
  }

  function bank() {
    const today = dayKey();
    addToBank({
      id: newId(),
      date: today,
      sessionId: session.id,
      row: workOn.row,
      focusId: workOn.focusId,
      label: workOn.label,
      before: workOn.said,
      after: attempt.trim(),
      transfer: transfer.trim() || undefined,
      reused: 0,
      step: 0,
      due: addDays(today, REVIEW_INTERVALS[0]),
      reviews: [],
    });
    patchSession(session.id, { banked: true });
  }

  const canBank = result?.ok && (!needsTransfer || transferResult?.ok);

  return (
    <div className="stack g12">
      <div className="field">
        <label htmlFor="rewrite" style={{ color: "var(--amber-deep)" }}>Rewrite it: edit your sentence</label>
        <textarea
          id="rewrite"
          rows={4}
          value={attempt}
          onChange={(e) => setAttempt(e.target.value)}
          onPaste={(e) => e.preventDefault()}
          disabled={banked || Boolean(result?.ok)}
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

      {!banked && !result?.ok && (
        <div className="stack g8">
          <button className="btn amber" onClick={check} disabled={checking || unchanged || !attempt.trim()}>
            {checking ? "Checking…" : unchanged ? "Change your sentence, then check it" : result ? "Check again" : "Check my rewrite"}
          </button>
          {level < HINTS.length && (
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

      {result?.ok && needsTransfer && !banked && (
        <div className="stack g10" style={{ borderTop: "1px solid var(--amber-tint)", paddingTop: 4 }}>
          <div className="field">
            <label htmlFor="transfer" style={{ color: "var(--amber-deep)" }}>One more step: use it somewhere new</label>
            <span className="hint">
              You saw a version, so show the pattern is yours: write one new sentence using {workOn.label.toLowerCase()} on a different topic,
              such as your own course.
            </span>
            <textarea
              id="transfer"
              rows={3}
              value={transfer}
              onChange={(e) => setTransfer(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              disabled={Boolean(transferResult?.ok)}
              style={{ fontFamily: "var(--serif)", fontSize: 18, lineHeight: 1.4 }}
            />
          </div>
          {!transferResult?.ok && (
            <button className="btn amber" onClick={checkTransfer} disabled={checking || transfer.trim().split(/\s+/).length < 5}>
              {checking ? "Checking…" : transferResult ? "Check again" : "Check my new sentence"}
            </button>
          )}
          {transferResult && (
            <p className="body" aria-live="polite" style={{ color: transferResult.ok ? "var(--blue)" : "var(--ink-2)", fontWeight: 500 }}>
              {transferResult.ok && <Check size={14} color="var(--blue)" />} {transferResult.comment}
            </p>
          )}
        </div>
      )}

      {error && <div className="error" role="alert">{error}</div>}

      {canBank && !banked && (
        <button className="btn" onClick={bank}>
          <Bookmark color="var(--on-ink)" size={18} /> Bank this sentence
        </button>
      )}
      {banked && (
        <p className="small row g6" role="status" style={{ color: "var(--blue)" }}>
          <Bookmark size={16} color="var(--blue)" /> Banked. You&apos;ll fix it again from memory tomorrow, then at longer gaps.
        </p>
      )}
    </div>
  );
}
