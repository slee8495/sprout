"use client";

const WIDTH = 600;
const HEIGHT = 200;
const PAD_X = 36;
const PAD_Y = 20;

export function GrowthChart({
  label,
  unit,
  points,
}: {
  label: string;
  unit: string;
  points: { date: string; value: number }[];
}) {
  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-800">
        {label}: no measurements yet.
      </div>
    );
  }

  const values = points.map((p) => p.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  const dates = points.map((p) => new Date(p.date).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const dateRange = maxDate - minDate || 1;

  function x(date: string) {
    const t = new Date(date).getTime();
    return PAD_X + ((t - minDate) / dateRange) * (WIDTH - PAD_X * 2);
  }

  function y(value: number) {
    return HEIGHT - PAD_Y - ((value - minValue) / valueRange) * (HEIGHT - PAD_Y * 2);
  }

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.date)} ${y(p.value)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <div className="viz-root rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <style>{`
        .viz-root { --gridline: #e1e0d9; --ink-muted: #898781; --series-1: #059669; --surface: #ffffff; }
        @media (prefers-color-scheme: dark) {
          .viz-root { --gridline: #2c2c2a; --ink-muted: #898781; --series-1: #34d399; --surface: #09090b; }
        }
      `}</style>
      <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</p>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full">
        {[0, 0.5, 1].map((frac) => (
          <line
            key={frac}
            x1={PAD_X}
            x2={WIDTH - PAD_X}
            y1={PAD_Y + frac * (HEIGHT - PAD_Y * 2)}
            y2={PAD_Y + frac * (HEIGHT - PAD_Y * 2)}
            stroke="var(--gridline)"
            strokeWidth={1}
          />
        ))}
        <text x={4} y={y(maxValue) + 4} fontSize={10} fill="var(--ink-muted)">
          {maxValue}
        </text>
        <text x={4} y={y(minValue) + 4} fontSize={10} fill="var(--ink-muted)">
          {minValue}
        </text>

        <path d={linePath} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p) => (
          <circle key={p.date} cx={x(p.date)} cy={y(p.value)} r={4} fill="var(--series-1)" stroke="var(--surface)" strokeWidth={2}>
            <title>
              {new Date(p.date).toLocaleDateString()}: {p.value} {unit}
            </title>
          </circle>
        ))}

        <text x={x(last.date)} y={y(last.value) - 10} fontSize={11} fill="var(--ink-muted)" textAnchor="end">
          {last.value} {unit}
        </text>
      </svg>
    </div>
  );
}
