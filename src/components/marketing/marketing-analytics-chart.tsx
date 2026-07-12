"use client";

import { useMemo, useState } from "react";

type ChartLabels = {
  periodLabel: string;
  tickLabels: string[];
  tickIndices: number[];
  qrScans: string;
  traffic: string;
  languageSwitches: string;
};

type MarketingAnalyticsChartProps = {
  labels: ChartLabels;
  locale: "en" | "es";
};

/** Mon–Sun weekly pattern: low Mon/Tue, build Thu, peak Fri/Sat (table QR scans). */
const WEEKLY_PATTERN = [48, 44, 72, 95, 168, 205, 112] as const;
const WEEK_MULTIPLIERS = [1, 1.03, 1.06, 1.09, 1.11] as const;
const CHART_DAYS = 30;
const Y_MAX = 280;

function buildDailySeries(
  pattern: readonly number[],
  multipliers: readonly number[],
  count: number
): number[] {
  const values: number[] = [];
  for (const multiplier of multipliers) {
    for (const day of pattern) {
      if (values.length >= count) break;
      values.push(Math.round(day * multiplier));
    }
  }
  return values.slice(0, count);
}

const QR_SERIES = buildDailySeries(WEEKLY_PATTERN, WEEK_MULTIPLIERS, CHART_DAYS);
const TRAFFIC_SERIES = QR_SERIES.map((value) => Math.round(value * 0.72));
const LANGUAGE_SERIES = QR_SERIES.map((value) => Math.round(value * 0.26));

const DEFAULT_ACTIVE_INDEX = 26;

const WIDTH = 800;
const HEIGHT = 320;
const PAD = { top: 24, right: 24, bottom: 40, left: 48 };

const DAY_NAMES = {
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  es: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
} as const;

function buildPoints(values: readonly number[], yMax: number) {
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;

  return values.map((value, index) => {
    const x = PAD.left + (index / (values.length - 1)) * innerW;
    const y = PAD.top + innerH - (value / yMax) * innerH;
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

function formatDayLabel(index: number, locale: "en" | "es"): string {
  const day = DAY_NAMES[locale][index % 7];
  const week = Math.floor(index / 7) + 1;
  return locale === "es" ? `${day} · Sem. ${week}` : `${day} · W${week}`;
}

export function MarketingAnalyticsChart({ labels, locale }: MarketingAnalyticsChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(DEFAULT_ACTIVE_INDEX);

  const qrPoints = useMemo(() => buildPoints(QR_SERIES, Y_MAX), []);
  const trafficPoints = useMemo(() => buildPoints(TRAFFIC_SERIES, Y_MAX), []);
  const languagePoints = useMemo(() => buildPoints(LANGUAGE_SERIES, Y_MAX), []);
  const baseline = HEIGHT - PAD.bottom;
  const hitWidth = (WIDTH - PAD.left - PAD.right) / CHART_DAYS;

  const gridLines = useMemo(() => {
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    return [0, 0.25, 0.5, 0.75, 1].map((ratio) => PAD.top + innerH * (1 - ratio));
  }, []);

  const active =
    activeIndex === null
      ? null
      : {
          qr: QR_SERIES[activeIndex],
          traffic: TRAFFIC_SERIES[activeIndex],
          language: LANGUAGE_SERIES[activeIndex],
          x: qrPoints[activeIndex]?.x ?? 0,
          dayLabel: formatDayLabel(activeIndex, locale),
        };

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)] sm:p-6">
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
          className="pointer-events-none absolute z-10 max-w-[11rem] rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm"
          style={{
            left: `clamp(0.5rem, calc(${(active.x / WIDTH) * 100}% - 5.5rem), calc(100% - 11.5rem))`,
            top: "0.75rem",
          }}
        >
          <p className="font-semibold text-slate-900">{active.dayLabel}</p>
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
        className="relative z-[1] h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={locale === "es" ? "Gráfico de rendimiento del menú" : "Menu performance chart"}
        onMouseLeave={() => setActiveIndex(DEFAULT_ACTIVE_INDEX)}
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

        <path d={toArea(qrPoints, baseline)} fill="url(#qrFill)" opacity="0.35" />
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
              x={point.x - hitWidth / 2}
              y={PAD.top}
              width={hitWidth}
              height={HEIGHT - PAD.top - PAD.bottom}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setActiveIndex(index)}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r={activeIndex === index ? 6 : 3}
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

        {labels.tickIndices.map((index, tickIndex) => {
          const x = qrPoints[index]?.x ?? 0;
          return (
            <text
              key={`${index}-${labels.tickLabels[tickIndex]}`}
              x={x}
              y={HEIGHT - 12}
              textAnchor="middle"
              className="fill-slate-400 text-[10px] font-medium sm:text-[11px]"
            >
              {labels.tickLabels[tickIndex]}
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

      <div className="relative z-[1] mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-600 sm:mt-4">
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
        <span className="w-full text-[10px] text-slate-400 sm:ml-auto sm:w-auto">{labels.periodLabel}</span>
      </div>
    </div>
  );
}
