import { Fragment } from "react";

type Mark = { quote: string; className: string; label: string };

/** Shows the student's paragraph with exact quotes from the feedback highlighted. */
export default function Marked({ text, marks }: { text: string; marks: Mark[] }) {
  const lower = text.toLowerCase();
  const ranges: { start: number; end: number; mark: Mark }[] = [];
  for (const m of marks) {
    const q = m.quote.trim().replace(/^["“]|["”]$/g, "");
    if (q.length < 4) continue;
    let start = text.indexOf(q);
    if (start < 0) start = lower.indexOf(q.toLowerCase());
    if (start < 0) continue;
    const end = start + q.length;
    if (ranges.some((r) => start < r.end && end > r.start)) continue;
    ranges.push({ start, end, mark: m });
  }
  ranges.sort((a, b) => a.start - b.start);
  const out: React.ReactNode[] = [];
  let pos = 0;
  ranges.forEach((r, i) => {
    if (r.start > pos) out.push(<Fragment key={`t${i}`}>{text.slice(pos, r.start)}</Fragment>);
    out.push(
      <mark key={`m${i}`} className={r.mark.className} style={{ color: "inherit" }}>
        <span className="sr-only">{r.mark.label}: </span>
        {text.slice(r.start, r.end)}
      </mark>,
    );
    pos = r.end;
  });
  if (pos < text.length) out.push(<Fragment key="end">{text.slice(pos)}</Fragment>);
  return <p className="paragraph">{out}</p>;
}
