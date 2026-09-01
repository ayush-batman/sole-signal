"use client";

import { ArrowDownRight, ArrowUpRight, Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/useWorkspace";

export function DemoBadge() {
  const { usingDemo } = useWorkspace();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${usingDemo ? "border-amber-300/70 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300" : "border-emerald-300/70 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"}`}
    >
      <Info className="h-3 w-3" />
      {usingDemo ? "Demo data" : "Live workspace"}
    </span>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        {eyebrow && (
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-[#2f726b] dark:text-[#84d4c7]">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl font-semibold tracking-[-.035em] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {children && (
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      )}
    </div>
  );
}
export function Score({
  value,
  label,
  tone = "teal",
  size = "md",
}: {
  value?: number | null;
  label: string;
  tone?: "teal" | "lime" | "amber" | "red";
  size?: "sm" | "md";
}) {
  const colours = {
    teal: "text-[#1f6b65] dark:text-[#75d2c6]",
    lime: "text-[#638316] dark:text-[#d8ff72]",
    amber: "text-amber-700 dark:text-amber-300",
    red: "text-rose-700 dark:text-rose-300",
  };
  return (
    <div
      className={cn(
        "rounded-xl border bg-background/70",
        size === "sm" ? "px-2.5 py-2" : "px-3.5 py-3",
      )}
    >
      <div
        className={cn(
          "font-semibold tabular-nums tracking-tight",
          size === "sm" ? "text-lg" : "text-2xl",
          colours[tone],
        )}
      >
        {value == null ? "—" : value}
      </div>
      <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[.12em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
export function StageBadge({ stage }: { stage?: string }) {
  const styles: Record<string, string> = {
    rising:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    emerging: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
    peaking:
      "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    declining: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
    discount_led:
      "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
    insufficient_history:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em]",
        styles[stage ?? ""] ?? "bg-muted text-muted-foreground",
      )}
    >
      {(stage ?? "insufficient_history").replaceAll("_", " ")}
    </span>
  );
}
export function ShoeArt({
  variant = 0,
  className,
}: {
  variant?: number;
  className?: string;
}) {
  const palettes = [
    ["#d7e8ca", "#153e3b", "#d8ff72"],
    ["#ead8c3", "#6e4d33", "#ffbe62"],
    ["#d9e4ee", "#273b57", "#85b8ff"],
    ["#ecdbe3", "#673a50", "#ffa6c9"],
    ["#dedaf0", "#463d76", "#bbb1ff"],
    ["#e4e2dc", "#3d4141", "#bfc3c1"],
  ][variant % 6];
  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl", className)}
      style={{ background: palettes[0] }}
    >
      <span
        className="absolute -right-6 -top-8 h-24 w-24 rounded-full opacity-40"
        style={{ background: palettes[2] }}
      />
      <svg
        viewBox="0 0 260 150"
        className="h-full w-full"
        role="img"
        aria-label="Stylised footwear silhouette"
      >
        <path
          d="M34 93c16-5 29-20 38-48 1-4 6-5 10-2l44 35c10 8 22 13 35 15l50 7c12 2 21 10 21 20 0 7-5 12-13 13l-135 1c-18 0-36-5-51-15-11-7-10-22 1-26Z"
          fill={palettes[1]}
        />
        <path
          d="M31 112c27 8 57 9 87 7l105-6c7 0 11 4 9 9-2 7-9 11-17 11H73c-17 0-31-3-42-9-7-4-7-10 0-12Z"
          fill="#faf8ee"
        />
        <path
          d="m85 61 24 20m-13-28 26 20m-9-13 29 18"
          stroke="#faf8ee"
          strokeWidth="5"
          strokeLinecap="round"
          opacity=".9"
        />
        <path
          d="M51 102c16 7 32 10 49 10"
          stroke={palettes[2]}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
export function Sparkline({
  values,
  good = true,
  className,
}: {
  values: number[];
  good?: boolean;
  className?: string;
}) {
  const width = 180,
    height = 48,
    pad = 3;
  const min = Math.min(...values),
    max = Math.max(...values);
  const points = values
    .map(
      (value, index) =>
        `${pad + index * ((width - pad * 2) / Math.max(values.length - 1, 1))},${pad + (max === min ? 0.5 : (max - value) / (max - min)) * (height - pad * 2)}`,
    )
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-12 w-full", className)}
      aria-label={`Trend from ${values[0]} to ${values.at(-1)}`}
    >
      <path
        d={`M${pad},${height - pad} L${points.replaceAll(" ", " L")} L${width - pad},${height - pad} Z`}
        fill={good ? "rgba(39,135,119,.10)" : "rgba(225,65,94,.10)"}
      />
      <polyline
        points={points}
        fill="none"
        stroke={good ? "#278777" : "#e1415e"}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function Delta({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold",
        up
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-rose-700 dark:text-rose-400",
      )}
    >
      {up ? (
        <ArrowUpRight className="h-3.5 w-3.5" />
      ) : (
        <ArrowDownRight className="h-3.5 w-3.5" />
      )}
      {Math.abs(value)}
      {suffix}
    </span>
  );
}
export function Confidence({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
      <ShieldCheck className="h-3.5 w-3.5 text-[#2f726b]" />
      {value}% confidence
    </span>
  );
}
export function LoadingPage() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-10 w-64 rounded-xl bg-muted" />
      <div className="h-5 w-96 max-w-full rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-56 rounded-2xl border bg-card" />
        ))}
      </div>
    </div>
  );
}
