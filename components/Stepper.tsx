const STEPS = ["Read", "Plan", "Write", "Feedback", "Rewrite"];

export default function Stepper({ current }: { current: number }) {
  return (
    <ol className="stepper" aria-label="Session steps" style={{ margin: 0, padding: 0, listStyle: "none" }}>
      {STEPS.map((s, i) => (
        <li key={s} className={`step${i < current ? " done" : i === current ? " now" : ""}`} aria-current={i === current ? "step" : undefined}>
          <span aria-hidden="true" />
          <span>{s}</span>
        </li>
      ))}
    </ol>
  );
}
