"use client";

import { useState } from "react";

/* Small, dependency-free charts for the progress dashboard.
   Marks use the validated chart tokens; text uses ink tokens; every chart has a table view. */

export function ChartCard({
  title,
  subtitle,
  children,
  table,
  legend,
  span = 1,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  table?: React.ReactNode;
  legend?: React.ReactNode;
  span?: 1 | 2 | 3;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <section className="card" style={{ gridColumn: `span ${span}` }} aria-label={title}>
      <div className="row between g8" style={{ alignItems: "flex-start" }}>
        <div className="stack g4">
          <h2 className="h3">{title}</h2>
          {subtitle && <span className="small">{subtitle}</span>}
        </div>
        {table && (
          <button className="text-btn" style={{ fontSize: 13, whiteSpace: "nowrap" }} onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
            {asTable ? "View as chart" : "View as table"}
          </button>
        )}
      </div>
      {legend && !asTable && <div className="legend">{legend}</div>}
      {asTable ? table : children}
    </section>
  );
}

export function Swatch({ color, ring = false }: { color: string; ring?: boolean }) {
  return <span className="swatch" style={ring ? { border: `2px solid ${color}`, width: 10, height: 10 } : { background: color }} />;
}

type Tip = { x: string; y: string; text: string } | null;

function Tooltip({ tip }: { tip: Tip }) {
  if (!tip) return null;
  return (
    <div
      role="status"
      style={{
        position: "absolute",
        left: tip.x,
        top: tip.y,
        transform: "translate(-50%, calc(-100% - 10px))",
        background: "var(--ink)",
        color: "var(--on-ink)",
        fontSize: 12,
        lineHeight: 1.35,
        padding: "6px 9px",
        borderRadius: 8,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      {tip.text}
    </div>
  );
}

/** Then-vs-now dot plot: one row per category, a light dot for "then", a strong dot for "now". */
type Scale = { ticks: { v: number; label: string }[]; fmt: (v: number) => string };
const PCT: Scale = { ticks: [0, 0.5, 1].map((v) => ({ v, label: `${Math.round(v * 100)}%` })), fmt: (v) => `${Math.round(v * 100)}%` };

export function Dumbbell({ rows, scale = PCT, label = "Areas shown well, then and now" }: { rows: { label: string; then: number | null; now: number | null; note?: string }[]; scale?: Scale; label?: string }) {
  const [tip, setTip] = useState<Tip>(null);
  const W = 560;
  const L = 150;
  const R = 60;
  const H = rows.length * 40 + 28;
  const x = (v: number) => L + v * (W - L - R);
  return (
    <div style={{ position: "relative" }}>
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} onMouseLeave={() => setTip(null)}>
        {scale.ticks.map((t) => (
          <g key={t.v}>
            <line x1={x(t.v)} x2={x(t.v)} y1={8} y2={H - 22} stroke="var(--chart-grid)" strokeWidth={1} />
            <text x={x(t.v)} y={H - 6} fontSize={11} textAnchor="middle" fill="var(--muted)">{t.label}</text>
          </g>
        ))}
        {rows.map((r, i) => {
          const y = 24 + i * 40;
          const text = `${r.label}: ${r.then !== null ? `then ${scale.fmt(r.then)}, ` : ""}now ${r.now !== null ? scale.fmt(r.now) : "not tested"}`;
          return (
            <g key={r.label} onMouseEnter={() => setTip({ x: `${(x(r.now ?? r.then ?? 0) / W) * 100}%`, y: `${((y - 8) / H) * 100}%`, text })}>
              <rect x={0} y={y - 18} width={W} height={36} fill="transparent" />
              <text x={0} y={y + 4} fontSize={13} fill="var(--ink-2)">{r.label}</text>
              {r.then !== null && r.now !== null && (
                <line x1={x(r.then)} x2={x(r.now)} y1={y} y2={y} stroke="var(--chart-blue-light)" strokeWidth={2} />
              )}
              {r.then !== null && <circle cx={x(r.then)} cy={y} r={6} fill="var(--chart-blue-light)" stroke="var(--card)" strokeWidth={2} />}
              {r.now !== null ? (
                <circle cx={x(r.now)} cy={y} r={7} fill="var(--chart-blue)" stroke="var(--card)" strokeWidth={2} />
              ) : (
                <text x={L} y={y + 4} fontSize={12} fill="var(--muted)">Not tested yet</text>
              )}
              {r.now !== null && (
                <text x={W - R + 8} y={y + 4} fontSize={12} fill="var(--ink-2)" fontWeight={600}>{scale.fmt(r.now)}</text>
              )}
            </g>
          );
        })}
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}

/** Single-series line with a hover crosshair. */
export function LineChart({ points, unit, label }: { points: { x: string; y: number }[]; unit: string; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 560;
  const H = 200;
  const P = { l: 36, r: 12, t: 14, b: 26 };
  const max = Math.max(10, ...points.map((p) => p.y)) * 1.15;
  const step = points.length > 1 ? (W - P.l - P.r) / (points.length - 1) : 0;
  const px = (i: number) => P.l + i * step;
  const py = (v: number) => H - P.b - (v / max) * (H - P.t - P.b);
  const ticks = [0, Math.round(max / 2), Math.round(max)];
  const d = points.map((p, i) => `${i ? "L" : "M"}${px(i)},${py(p.y)}`).join(" ");
  return (
    <div style={{ position: "relative" }}>
      <svg
        className="chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={label}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const vx = ((e.clientX - r.left) / r.width) * W;
          const i = step ? Math.round((vx - P.l) / step) : 0;
          setHover(Math.max(0, Math.min(points.length - 1, i)));
        }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={py(t)} y2={py(t)} stroke="var(--chart-grid)" />
            <text x={P.l - 6} y={py(t) + 4} fontSize={11} textAnchor="end" fill="var(--muted)">{t}</text>
          </g>
        ))}
        {points.length > 1 && <path d={d} fill="none" stroke="var(--chart-blue)" strokeWidth={2} strokeLinejoin="round" />}
        {points.map((p, i) => (
          <circle key={i} cx={px(i)} cy={py(p.y)} r={hover === i ? 5 : 3} fill="var(--chart-blue)" stroke="var(--card)" strokeWidth={2} />
        ))}
        {hover !== null && <line x1={px(hover)} x2={px(hover)} y1={P.t} y2={H - P.b} stroke="var(--line-2)" strokeDasharray="3 3" />}
        {points.length > 0 && (
          <>
            <text x={P.l} y={H - 6} fontSize={11} fill="var(--muted)">{points[0].x}</text>
            <text x={W - P.r} y={H - 6} fontSize={11} textAnchor="end" fill="var(--muted)">{points[points.length - 1].x}</text>
          </>
        )}
      </svg>
      {hover !== null && points[hover] && (
        <Tooltip tip={{ x: `${(px(hover) / W) * 100}%`, y: `${(py(points[hover].y) / H) * 100}%`, text: `${points[hover].x}: ${points[hover].y} ${unit}` }} />
      )}
    </div>
  );
}

/** Horizontal bars, labelled directly. */
export function HBars({ rows, max, format = (v) => String(v), color = "var(--chart-blue)" }: { rows: { label: string; value: number; sub?: string }[]; max?: number; format?: (v: number) => string; color?: string }) {
  const m = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="stack g8" role="list">
      {rows.map((r) => (
        <div key={r.label} role="listitem" title={`${r.label}: ${format(r.value)}${r.sub ? ` (${r.sub})` : ""}`} style={{ display: "grid", gridTemplateColumns: "120px minmax(0, 1fr) 64px", gap: 10, alignItems: "center" }}>
          <span className="small" style={{ color: "var(--ink-2)" }}>{r.label}</span>
          <div style={{ background: "var(--paper)", borderRadius: 4, height: 14 }}>
            {r.value > 0 && <div className="hbar" style={{ width: `${Math.max(2, (r.value / m) * 100)}%`, background: color }} />}
          </div>
          <span className="small" style={{ color: "var(--ink-2)", fontVariantNumeric: "tabular-nums" }}>{format(r.value)}</span>
        </div>
      ))}
    </div>
  );
}
