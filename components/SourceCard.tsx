"use client";

import { useState } from "react";
import { postJSON } from "@/lib/api";
import type { Source } from "@/lib/bank/types";

type Explained = { plain: string; keyWords: { word: string; meaning: string }[] };

/** A genuine source extract with its full reference, and an optional plain-English helper. */
export default function SourceCard({ source, compact = false, helper = true, label }: { source: Source; compact?: boolean; helper?: boolean; label?: string }) {
  const [explained, setExplained] = useState<Explained | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function explain() {
    setBusy(true);
    setErr(null);
    try {
      setExplained(await postJSON<Explained>("/api/explain", { text: source.text, cite: source.cite }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't explain that just now.");
    }
    setBusy(false);
  }

  return (
    <figure className="source">
      <span className="eyebrow">{label ?? (source.kind === "data" ? "Data" : "Source")} · {source.cite}</span>
      <blockquote data-dict={source.cite} style={compact ? { fontSize: 15 } : undefined}>
        {source.own ? source.text : `“${source.text}”`}
      </blockquote>
      <figcaption className="ref">
        {source.own ? (
          <>Your own source{source.title ? `: ${source.title}` : ""}.</>
        ) : (
          <>
            {source.authors} ({source.year}). {source.title}. <em>{source.journal}</em>.{" "}
            {source.doi ? (
              <a href={`https://doi.org/${source.doi}`} target="_blank" rel="noreferrer">
                doi:{source.doi}
              </a>
            ) : (
              <a href={source.url} target="_blank" rel="noreferrer">
                Link
              </a>
            )}{" "}
            · {source.license} · extract from the {source.section ?? "abstract"}
          </>
        )}
      </figcaption>
      {helper && !compact && (
        <div className="stack g8">
          {!explained && (
            <button className="text-btn" onClick={explain} disabled={busy} style={{ alignSelf: "flex-start" }}>
              {busy ? "Explaining…" : "Help me understand this"}
            </button>
          )}
          {explained && (
            <div className="card tight flat">
              <span className="eyebrow blue">In plain English</span>
              <p className="body" data-dict={source.cite}>{explained.plain}</p>
              {explained.keyWords.length > 0 && (
                <div className="stack g4">
                  {explained.keyWords.map((k) => (
                    <span key={k.word} className="small" data-dict={source.cite}>
                      <strong style={{ color: "var(--ink)" }}>{k.word}</strong>: {k.meaning}
                    </span>
                  ))}
                </div>
              )}
              <span className="small">Select any word to add it to your dictionary.</span>
            </div>
          )}
          {err && <div className="error">{err}</div>}
        </div>
      )}
    </figure>
  );
}
