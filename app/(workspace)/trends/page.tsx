"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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

export default function Trends() {
  const { workspaceSlug, loading } = useWorkspace();
  const rows = useQuery(api.trends.list, loading ? "skip" : { workspaceSlug });
  const [stage, setStage] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () =>
      rows?.filter(
        (r: any) =>
          (stage === "all" || r.score?.stage === stage) &&
          r.name.toLowerCase().includes(search.toLowerCase()),
      ) ?? [],
    [rows, stage, search],
  );
  if (loading || !rows) return <LoadingPage />;
  return (
    <>
      <PageHeader
        eyebrow="Style intelligence"
        title="Trend explorer"
        description="Different products grouped by the footwear design direction they express."
      >
        <DemoBadge />
      </PageHeader>
      <div className="data-card mb-5 flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search silhouette, material, aesthetic…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          <Filter className="mx-2 h-4 w-4 text-muted-foreground" />
          {[
            "all",
            "rising",
            "emerging",
            "peaking",
            "discount_led",
            "declining",
          ].map((v) => (
            <button
              key={v}
              onClick={() => setStage(v)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize whitespace-nowrap ${stage === v ? "bg-[#173e3d] text-white" : "hover:bg-muted"}`}
            >
              {v.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((row: any, index: number) => (
          <Link
            href={`/trends/${row.slug}`}
            key={row._id}
            className="data-card group overflow-hidden p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="relative">
              <ShoeArt variant={index} className="h-44" />
              <div className="absolute left-3 top-3">
                <StageBadge stage={row.score?.stage} />
              </div>
            </div>
            <h2 className="mt-4 min-h-12 font-display text-xl font-semibold leading-6">
              {row.name}
            </h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {row.keyAttributes.slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Score size="sm" value={row.score?.score} label="Trend" />
              <Score
                size="sm"
                value={row.opportunity?.score}
                label="Opp."
                tone="lime"
              />
              <Score
                size="sm"
                value={row.opportunity?.saturation}
                label="Supply"
                tone={row.opportunity?.saturation > 70 ? "amber" : "teal"}
              />
            </div>
            <Sparkline
              values={row.timeline.map((v: any) => v.rank ?? 0).reverse()}
              good={row.score?.stage !== "declining"}
              className="mt-3"
            />
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-xs text-muted-foreground">
                ₹{row.priceMin.toLocaleString("en-IN")}–₹
                {row.priceMax.toLocaleString("en-IN")} · {row.productCount}{" "}
                products
              </span>
              <Confidence value={row.score?.confidence ?? 0} />
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
