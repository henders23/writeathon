import type { Carried } from "@/lib/types";

/** The one strategy carried over from the feedback on the last paragraph, shown where it can be used. */
export default function CarryNote({ carry, compact }: { carry: Carried; compact?: boolean }) {
  return (
    <section className="card amber tight" aria-label="From your last feedback">
      <span className="eyebrow amber">From your last feedback: try this today</span>
      <p className="body" style={{ fontSize: compact ? 14 : 15, color: "var(--ink)" }}>{carry.strategy}</p>
      {carry.own && (
        <p className="small" style={{ fontSize: 13.5 }}>
          <strong style={{ color: "var(--ink-2)" }}>You wrote:</strong> “{carry.own}”
        </p>
      )}
    </section>
  );
}
