"use client";

import { useMemo } from "react";
import type { ProfitPoint } from "@/lib/stats";

export function ProfitChart({ points }: { points: ProfitPoint[] }) {
  const W = 640;
  const H = 220;
  const PAD = 28;

  const { path, area, zeroY, lastUp, dots } = useMemo(() => {
    const profits = points.map((p) => p.profit);
    const min = Math.min(0, ...profits);
    const max = Math.max(0, ...profits);
    const range = max - min || 1;

    const x = (i: number) =>
      PAD + (i / Math.max(1, points.length - 1)) * (W - PAD * 2);
    const y = (v: number) => PAD + (1 - (v - min) / range) * (H - PAD * 2);

    const path = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.profit).toFixed(1)}`)
      .join(" ");
    const area =
      `${path} L ${x(points.length - 1).toFixed(1)} ${y(min).toFixed(1)} ` +
      `L ${x(0).toFixed(1)} ${y(min).toFixed(1)} Z`;

    const dots = points.map((p, i) => ({ cx: x(i), cy: y(p.profit), profit: p.profit }));

    return {
      path,
      area,
      zeroY: y(0),
      lastUp: profits[profits.length - 1] >= 0,
      dots,
    };
  }, [points]);

  const stroke = lastUp ? "#3ddc84" : "#ff5d6c";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Profit over time">
      <defs>
        <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* zero baseline */}
      <line
        x1={PAD}
        x2={W - PAD}
        y1={zeroY}
        y2={zeroY}
        stroke="#283145"
        strokeDasharray="4 4"
      />
      <text x={PAD} y={zeroY - 4} fontSize="10" fill="#5b6885">
        break-even
      </text>

      {points.length > 1 && <path d={area} fill="url(#profitFill)" />}
      {points.length > 1 && (
        <path d={path} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
      )}

      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.cx}
          cy={d.cy}
          r={i === dots.length - 1 ? 4 : 2.5}
          fill={d.profit >= 0 ? "#3ddc84" : "#ff5d6c"}
        />
      ))}
    </svg>
  );
}
