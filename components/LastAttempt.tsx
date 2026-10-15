import type { Session } from "@/lib/types";
import { parseDay } from "@/lib/dates";
import { areasShownWell } from "@/lib/progress";

/** Task repetition: the student's earlier paragraph on this same question, folded away so it informs rather than gets copied. */
export default function LastAttempt({ session }: { session: Session }) {
  const when = parseDay(session.date).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  const areas = areasShownWell(session);
  const work = session.feedback?.workOn;
  return (
    <section className="card amber tight" aria-label="Your last attempt">
      <span className="eyebrow amber">Beat your last attempt</span>
      <p className="body" style={{ fontSize: 14, color: "var(--ink-2)" }}>
        You answered this on {when}: {session.words} words{areas !== null ? `, ${areas} of 5 areas shown well` : ""}.
        {work ? ` Your sentence to rewrite was about ${work.label.toLowerCase()}.` : ""} Aim to do better on both today.
      </p>
      <details>
        <summary className="small" style={{ cursor: "pointer", minHeight: 32, color: "var(--amber-deep)" }}>Read what you wrote</summary>
        <p className="paragraph" style={{ fontSize: 16, marginTop: 8 }}>{session.text}</p>
      </details>
    </section>
  );
}
