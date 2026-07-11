"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type ChartLabels = {
  months: string[];
  qrScans: string;
  traffic: string;
  languageSwitches: string;
};

type MarketingAnalyticsChartProps = {
  labels: ChartLabels;
  locale: "en" | "es";
};

const SERIES = {
  qr: [1200, 1850, 2600, 3400, 4700, 6200],
  traffic: [820, 1180, 1650, 2280, 3100, 4100],
  language: [390, 580, 860, 1180, 1620, 2240],
} as const;

const WIDTH = 800;
const HEIGHT = 320;
const PAD = { top: 24, right: 24, bottom: 40, left: 48 };

function buildPoints(values: readonly number[]) {
  const max = Math.max(...values);
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;

  return values.map((value, index) => {
    const x = PAD.left + (index / (values.length - 1)) * innerW;
    const y = PAD.top + innerH - (value / max) * innerH;
    return { x, y, value };
  });
}

function toPath(points: { x: number; y: number }[]) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function toArea(points: { x: number; y: number }[], baseline: number) {
  if (points.length === 0) return "";
  const line = toPath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
}

export function MarketingAnalyticsChart({ labels, locale }: MarketingAnalyticsChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(5);

  const qrPoints = useMemo(() => buildPoints(SERIES.qr), []);
  const trafficPoints = useMemo(() => buildPoints(SERIES.traffic), []);
  const languagePoints = useMemo(() => buildPoints(SERIES.language), []);
  const baseline = HEIGHT - PAD.bottom;

  const gridLines = useMemo(() => {
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    return [0, 0.25, 0.5, 0.75, 1].map((ratio) => PAD.top + innerH * (1 - ratio));
  }, []);

  const active =
    activeIndex === null
      ? null
      : {
          qr: SERIES.qr[activeIndex],
          traffic: SERIES.traffic[activeIndex],
          language: SERIES.language[activeIndex],
          x: qrPoints[activeIndex]?.x ?? 0,
          month: labels.months[activeIndex] ?? "",
        };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)] sm:p-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.12) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden
      />

      {active && (
        <div
          className="pointer-events-none absolute z-10 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm"
          style={{ left: `calc(${(active.x / WIDTH) * 100}% - 4rem)`, top: "0.75rem" }}
        >
          <p className="font-semibold text-slate-900">{active.month}</p>
          <p className="mt-1 text-[#22c55e]">
            {labels.qrScans}: {active.qr.toLocaleString(locale)}
          </p>
          <p className="text-slate-600">
            {labels.traffic}: {active.traffic.toLocaleString(locale)}
          </p>
          <p className="text-emerald-600/80">
            {labels.languageSwitches}: {active.language.toLocaleString(locale)}
          </p>
        </div>
      )}

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="relative z-[1] h-auto w-full"
        role="img"
        aria-label={locale === "es" ? "Gráfico de rendimiento del menú" : "Menu performance chart"}
        onMouseLeave={() => setActiveIndex(5)}
      >
        {gridLines.map((y) => (
          <line
            key={y}
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={y}
            y2={y}
            stroke="rgba(148,163,184,0.25)"
            strokeWidth="1"
          />
        ))}

        <path
          d={toArea(qrPoints, baseline)}
          fill="url(#qrFill)"
          opacity="0.35"
        />
        <path
          d={toPath(qrPoints)}
          fill="none"
          stroke="#22c55e"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 0 8px rgba(34,197,94,0.45))" }}
        />

        <path
          d={toPath(trafficPoints)}
          fill="none"
          stroke="#16a34a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="6 4"
          opacity="0.85"
        />

        <path
          d={toPath(languagePoints)}
          fill="none"
          stroke="#4ade80"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />

        {qrPoints.map((point, index) => (
          <g key={index}>
            <rect
              x={point.x - 36}
              y={PAD.top}
              width={72}
              height={HEIGHT - PAD.top - PAD.bottom}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setActiveIndex(index)}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r={activeIndex === index ? 7 : 4}
              fill="#22c55e"
              stroke="white"
              strokeWidth="2"
              className="transition-all duration-200"
              style={
                activeIndex === index
                  ? { filter: "drop-shadow(0 0 10px rgba(34,197,94,0.65))" }
                  : undefined
              }
            />
          </g>
        ))}

        {labels.months.map((month, index) => {
          const x = qrPoints[index]?.x ?? 0;
          return (
            <text
              key={month}
              x={x}
              y={HEIGHT - 12}
              textAnchor="middle"
              className="fill-slate-400 text-[11px] font-medium"
            >
              {month}
            </text>
          );
        })}

        <defs>
          <linearGradient id="qrFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative z-[1] mt-4 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-6 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          {labels.qrScans}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-6 rounded-full border border-dashed border-[#16a34a]" />
          {labels.traffic}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-6 rounded-full bg-[#4ade80]" />
          {labels.languageSwitches}
        </span>
      </div>
    </div>
  );
}
