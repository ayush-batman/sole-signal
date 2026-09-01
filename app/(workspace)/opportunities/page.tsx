"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useWorkspace } from "@/lib/useWorkspace";
import { ArrowUpRight, CircleHelp } from "lucide-react";
import {
  DemoBadge,
  LoadingPage,
  PageHeader,
  Score,
  StageBadge,
} from "@/components/MarketUI";

export default function Opportunities() {
  const { workspaceSlug, loading } = useWorkspace();
  const rows = useQuery(api.trends.list, loading ? "skip" : { workspaceSlug });
  if (loading || !rows) return <LoadingPage />;
  const sorted = [...rows].sort(
    (a: any, b: any) =>
      (b.opportunity?.score ?? 0) - (a.opportunity?.score ?? 0),
  );
  return (
    <>
      <PageHeader
        eyebrow="Demand versus saturation"
        title="Opportunity map"
        description="A trend can be strong and still be a poor opportunity when supply is crowded or discount-led."
      >
        <DemoBadge />
      </PageHeader>
      <div className="data-card p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#2f8278]" />
            More attractive
          </span>
          <span>
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-amber-500" />
            Crowded
          </span>
          <span className="inline-flex items-center gap-1">
            <CircleHelp className="h-3.5 w-3.5" />
            Bubble size = price span
          </span>
        </div>
        <div className="relative h-[430px] overflow-hidden rounded-2xl border bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:25%_25%]">
          <div className="absolute inset-y-0 left-1/2 border-l border-dashed" />
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed" />
          <span className="absolute left-3 top-3 text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">
            High estimated demand
          </span>
          <span className="absolute bottom-3 right-3 text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">
            High saturation →
          </span>
          {rows.map((row: any, index: number) => {
            const x = Math.max(
              7,
              Math.min(90, row.opportunity?.saturation ?? 50),
            );
            const y = 100 - Math.max(12, Math.min(90, row.score?.score ?? 50));
            const size = 58 + Math.min(34, (row.priceMax - row.priceMin) / 100);
            return (
              <Link
                href={`/trends/${row.slug}`}
                key={row._id}
                className={`absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 p-2 text-center text-[9px] font-semibold leading-tight shadow-lg transition-transform hover:scale-110 ${row.opportunity?.score >= 70 ? "border-[#2f8278] bg-[#d8ff72] text-[#102f2d]" : "border-amber-500 bg-card"}`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: size,
                  height: size,
                  zIndex: 10 - index,
                }}
              >
                {row.name.split(" ").slice(0, 3).join(" ")}
              </Link>
            );
          })}
        </div>
        <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
          <span>Low saturation</span>
          <span>High saturation</span>
        </div>
      </div>
      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((row: any) => (
          <Link
            href={`/trends/${row.slug}`}
            key={row._id}
            className="data-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <StageBadge stage={row.score?.stage} />
                <h2 className="mt-2 font-semibold leading-snug">{row.name}</h2>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Score size="sm" value={row.score?.score} label="Demand" />
              <Score
                size="sm"
                value={row.opportunity?.saturation}
                label="Supply"
                tone={row.opportunity?.saturation > 70 ? "amber" : "teal"}
              />
              <Score
                size="sm"
                value={row.opportunity?.score}
                label="Opp."
                tone="lime"
              />
            </div>
          </Link>
        ))}
      </section>
    </>
  );
}
