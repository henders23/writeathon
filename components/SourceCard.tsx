import type { Source } from "@/lib/bank/types";

export default function SourceCard({ source }: { source: Source }) {
  return (
    <figure className="source" style={{ margin: 0 }}>
      <span className="eyebrow">{source.kind === "data" ? "Data" : "Source"} · {source.author} ({source.year})</span>
      <p>{source.text}</p>
      <figcaption className="cite">Practice source written for Writeathon{source.kind === "data" ? "; figures are illustrative" : ""}. Cite it as {source.author} ({source.year}).</figcaption>
    </figure>
  );
}
