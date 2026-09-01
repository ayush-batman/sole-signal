"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ArrowRight,
  BellRing,
  Clock3,
  Database,
  Eye,
  Layers3,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/lib/useWorkspace";
import {
  Confidence,
  DemoBadge,
  LoadingPage,
  PageHeader,
  Score,
  ShoeArt,
  Sparkline,
  StageBadge,
} from "@/components/MarketUI";

export default function Dashboard() {
  const { workspaceSlug, usingDemo, loading } = useWorkspace();
  const data = useQuery(
    api.dashboard.overview,
    loading ? "skip" : { workspaceSlug },
  );
  const [category, setCategory] = useState("formal");
  const [audience, setAudience] = useState("all");
  const [price, setPrice] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [days, setDays] = useState("30");
  const productRows = useQuery(
    api.products.list,
    loading
      ? "skip"
      : {
          workspaceSlug,
          windowDays: Number(days) as 7 | 30 | 90 | 180,
        },
  );
  const filtered = useMemo(
    () =>
      data?.trends.filter(
        (item: any) =>
          (category === "all" || item.primaryCategory === category) &&
          (audience === "all" || item.audiences.includes(audience)) &&
          (platform === "all" || item.platforms.includes(platform)) &&
          (price === "all" ||
            (price === "value-mass" && item.priceMin < 1500) ||
            (price === "mid" &&
              item.priceMax >= 1500 &&
              item.priceMin < 3000) ||
            (price === "premium" && item.priceMax >= 3000)),
      ) ?? [],
    [data, category, audience, price, platform],
  );
  if (loading || !data) return <LoadingPage />;
  const lead = [...filtered].sort(
    (a: any, b: any) => (b.trend?.score ?? 0) - (a.trend?.score ?? 0),
  )[0];
  const leadTrend = lead?.trend;
  const focusedProductRows = (productRows ?? []).filter(
    (row: any) => category === "all" || row.marketCategory === category,
  );
  const rankedLiveProducts = [...focusedProductRows]
    .filter((row: any) => row.windowTrend?.score != null)
    .sort(
      (a: any, b: any) =>
        (b.windowTrend?.score ?? 0) - (a.windowTrend?.score ?? 0),
    );
  const leadLiveProduct = rankedLiveProducts[0];
  const observedLiveDays = Math.max(
    0,
    ...focusedProductRows.map((row: any) => row.windowTrend?.evidenceDays ?? 0),
  );
  const visibleOpportunities = [...filtered]
    .filter((item: any) => (item.opportunity?.score ?? 0) >= 70)
    .sort(
      (a: any, b: any) =>
        (b.opportunity?.score ?? 0) - (a.opportunity?.score ?? 0),
    );
  const platformOptions = [
    ...new Set(data.trends.flatMap((item: any) => item.platforms)),
  ] as string[];
  const signalValues =
    days === "7"
      ? [65, 76, 84]
      : days === "90"
        ? [28, 31, 35, 42, 49, 57, 65, 76, 84]
        : [42, 49, 57, 65, 76, 84];
  return (
    <>
      <PageHeader
        eyebrow="Decision room"
        title="What is moving now"
        description="Estimated demand, supply pressure, and the next actions supported by current observations."
      >
        <DemoBadge />
        <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
          <Clock3 className="h-3.5 w-3.5" />
          {data.coverage.lastUpdated
            ? `Updated ${new Date(data.coverage.lastUpdated).toLocaleString("en-IN")}`
            : "No observations yet"}
        </span>
      </PageHeader>
      <div className="data-card mb-4 grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardFilter
          label="Category"
          value={category}
          onChange={setCategory}
        >
          <option value="all">All categories</option>
          {["casual", "comfort", "formal", "performance"].map((value) => (
            <option key={value} value={value}>
              {value[0].toUpperCase() + value.slice(1)}
            </option>
          ))}
        </DashboardFilter>
        <DashboardFilter label="Gender" value={audience} onChange={setAudience}>
          <option value="all">All genders</option>
          <option value="men">Men</option>
          <option value="women">Women</option>
        </DashboardFilter>
        <DashboardFilter label="Price" value={price} onChange={setPrice}>
          <option value="all">All price bands</option>
          <option value="value-mass">Below ₹1,500</option>
          <option value="mid">₹1,500–₹2,999</option>
          <option value="premium">₹3,000+</option>
        </DashboardFilter>
        <DashboardFilter
          label="Platform"
          value={platform}
          onChange={setPlatform}
        >
          <option value="all">All platforms</option>
          {platformOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </DashboardFilter>
        <DashboardFilter label="Date range" value={days} onChange={setDays}>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="180">Last 6 months</option>
        </DashboardFilter>
      </div>
      <section className="grid gap-4 xl:grid-cols-[1.4fr_.6fr]">
        {!usingDemo && (
          <div className="data-card overflow-hidden p-5">
            <p className="text-xs font-bold uppercase tracking-[.13em] text-[#2f726b] dark:text-[#84d4c7]">
              Verified {days}-day signal
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">
              {leadLiveProduct
                ? leadLiveProduct.listing.title
                : "Building the real observation history"}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {leadLiveProduct
                ? leadLiveProduct.windowTrend!.explanation
                : `${focusedProductRows.length} ${category === "all" ? "live" : category} listings are tracked. ${observedLiveDays} real days are currently available; no trend is claimed before the selected window has enough evidence.`}
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <Score
                value={leadLiveProduct?.windowTrend?.score ?? null}
                label="Trend"
              />
              <Score
                value={leadLiveProduct?.windowTrend?.confidence ?? 0}
                label="Confidence"
              />
              <Score value={observedLiveDays} label="Days observed" />
            </div>
            <Link href="/products" className="mt-5 inline-flex">
              <Button variant="outline" size="sm">
                Inspect every product <ArrowRight />
              </Button>
            </Link>
          </div>
        )}
        {lead && leadTrend && (
          <div className="data-card overflow-hidden p-4 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <StageBadge stage={leadTrend.stage} />
                <h2 className="mt-3 max-w-xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  {lead.name}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Best clean momentum across the current India coverage.
                </p>
              </div>
              <Link href={`/trends/${lead.slug}`}>
                <Button variant="ghost" size="sm">
                  View evidence <ArrowRight />
                </Button>
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-[1.15fr_.85fr]">
              <ShoeArt className="h-64" />
              <div className="flex flex-col justify-between">
                <div className="grid grid-cols-3 gap-2">
                  <Score value={leadTrend.score} label="Trend" />
                  <Score
                    value={lead.opportunity?.score}
                    label="Opportunity"
                    tone="lime"
                  />
                  <Score value={leadTrend.confidence} label="Confidence" />
                </div>
                <div className="my-4 rounded-xl bg-muted/60 px-4 py-3">
                  <p className="text-xs font-semibold">30-day signal</p>
                  <Sparkline values={signalValues} />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>
                      {days === "7"
                        ? "25 Aug"
                        : days === "90"
                          ? "3 Jun"
                          : "1 Aug"}
                    </span>
                    <span>31 Aug</span>
                  </div>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  <strong className="text-foreground">Why now:</strong>{" "}
                  {leadTrend.explanation}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="data-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.13em] text-muted-foreground">
                Coverage
              </p>
              <p className="mt-2 font-display text-2xl font-semibold">
                Evidence health
              </p>
            </div>
            <Database className="h-5 w-5 text-[#2f726b]" />
          </div>
          <div className="mt-6 space-y-5">
            <Metric
              icon={Eye}
              label="Observations"
              value={String(data.coverage.observations)}
              detail={usingDemo ? "Across 30 days" : "Live snapshots"}
            />
            <Metric
              icon={Layers3}
              label="Products"
              value={String(data.coverage.products)}
              detail={usingDemo ? "6 style clusters" : "Observed listings"}
            />
            <Metric
              icon={Target}
              label="Independent sources"
              value={String(data.coverage.sources)}
              detail={usingDemo ? "Synthetic demo surfaces" : "Live sources"}
            />
          </div>
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            {usingDemo
              ? "This workspace is reproducible demo data. It never appears as live ecommerce findings."
              : "Live catalog facts are shown as observations. Demand scores stay blank until enough history exists."}
          </div>
        </div>
      </section>
      <section className="mt-7">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">
              Opportunities
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold">
              Whitespace worth testing
            </h2>
          </div>
          <Link
            href="/opportunities"
            className="text-xs font-semibold text-[#2f726b] dark:text-[#84d4c7]"
          >
            See demand vs supply →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleOpportunities.slice(0, 3).map((item: any, index: number) => (
            <Link
              href={`/trends/${item.slug}`}
              key={item._id}
              className="data-card group p-4 transition-transform hover:-translate-y-0.5"
            >
              <ShoeArt variant={index + 2} className="h-36" />
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <StageBadge stage={item.trend.stage} />
                  <h3 className="mt-2 font-semibold leading-snug">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ₹{item.priceMin.toLocaleString("en-IN")}–₹
                    {item.priceMax.toLocaleString("en-IN")}
                  </p>
                </div>
                <Score
                  size="sm"
                  value={item.opportunity.score}
                  label="Opp."
                  tone="lime"
                />
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <span className="text-xs text-muted-foreground">
                  Saturation {item.opportunity.saturation}
                </span>
                <Confidence value={item.trend.confidence} />
              </div>
            </Link>
          ))}
          {!visibleOpportunities.length && (
            <div className="data-card col-span-full p-8 text-center text-sm text-muted-foreground">
              No opportunity matches every selected filter. Widen one filter to
              compare more evidence.
            </div>
          )}
        </div>
      </section>
      <section className="mt-7 grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <div className="data-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">
                Recommended actions
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                Do next
              </h2>
            </div>
            <Target className="h-5 w-5 text-[#2f726b]" />
          </div>
          <div className="divide-y">
            {data.recommendations.map((rec: any, index: number) => (
              <div className="flex gap-3 py-4" key={rec._id}>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#173e3d] text-xs font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#d8ff72] px-2 py-0.5 text-[9px] font-bold uppercase text-[#173e3d]">
                      {rec.action}
                    </span>
                    <Confidence value={rec.confidence} />
                  </div>
                  <p className="mt-1.5 text-sm font-semibold">{rec.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {rec.rationale}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="data-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <BellRing className="h-4 w-4 text-amber-600" />
            <h2 className="font-display text-2xl font-semibold">
              Important alerts
            </h2>
          </div>
          <div className="space-y-3">
            {data.alerts.map((alert: any) => (
              <div
                key={alert.title}
                className="rounded-xl border bg-muted/30 p-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${alert.severity === "high" ? "bg-rose-500" : alert.severity === "medium" ? "bg-amber-500" : "bg-cyan-500"}`}
                  />
                  <p className="text-sm font-semibold">{alert.title}</p>
                </div>
                <p className="mt-1 pl-4 text-xs leading-5 text-muted-foreground">
                  {alert.detail}
                </p>
              </div>
            ))}
          </div>
          <Link href="/alerts">
            <Button variant="outline" className="mt-4 w-full">
              Manage alert rules
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
function DashboardFilter({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="text-[10px] font-bold uppercase tracking-[.09em] text-muted-foreground">
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-9 w-full rounded-lg border bg-background px-2 text-xs font-medium normal-case tracking-normal text-foreground"
      >
        {children}
      </select>
    </label>
  );
}
function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: any;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f2ef] text-[#2f726b] dark:bg-[#123331]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold tabular-nums">{value}</p>
      </div>
      <span className="text-[10px] text-muted-foreground">{detail}</span>
    </div>
  );
}
