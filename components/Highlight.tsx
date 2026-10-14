import { Fragment } from "react";

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Wraps any occurrence of the given phrases in a marked span (case-insensitive, simple inflections). */
export default function Highlight({ text, phrases, className }: { text: string; phrases: string[]; className: string }) {
  const parts = phrases
    .map((p) =>
      p
        .replace(/\([^)]*\)/g, " ")
        .replace(/…|\.\.\./g, " ")
        .replace(/[“”",]/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean),
    )
    .filter((w) => w.length > 0)
    .map((words) => words.map(escape).join("[\\s,]+") + "\\w*");
  if (!parts.length || !text) return <>{text}</>;
  const re = new RegExp(`(${parts.join("|")})`, "gi");
  const pieces = text.split(re);
  return (
    <>
      {pieces.map((piece, i) =>
        i % 2 === 1 ? (
          <span key={i} className={className}>
            {piece}
          </span>
        ) : (
          <Fragment key={i}>{piece}</Fragment>
        ),
      )}
    </>
  );
}
