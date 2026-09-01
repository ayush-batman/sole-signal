"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CircleCheck, CircleOff, TriangleAlert } from "lucide-react";
import { DemoBadge, LoadingPage, PageHeader } from "@/components/MarketUI";

export default function Sources() {
  const rows = useQuery(api.sources.list, {});
  if (!rows) return <LoadingPage />;
  return (
    <>
      <PageHeader
        eyebrow="Coverage and extraction health"
        title="Sources"
        description="Connection state, freshness, field coverage, reliability, compliance, and the latest extraction problem."
      >
        <DemoBadge />
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((source: any) => (
          <div key={source._id} className="data-card p-5">
            <div className="flex items-start justify-between">
              <span
                className={`grid h-10 w-10 place-items-center rounded-xl ${source.status === "healthy" ? "bg-emerald-100 text-emerald-700" : source.status === "not_connected" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"}`}
              >
                {source.status === "healthy" ? (
                  <CircleCheck className="h-5 w-5" />
                ) : source.status === "not_connected" ? (
                  <CircleOff className="h-5 w-5" />
                ) : (
                  <TriangleAlert className="h-5 w-5" />
                )}
              </span>
              <Status status={source.status} />
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold">
              {source.name}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {source.accessMethod.replaceAll("_", " ")} · reliability{" "}
              {Math.round(source.reliabilityWeight * 100)}%
            </p>
            {source.metrics ? (
              <div className="mt-5 grid grid-cols-2 gap-2">
                {[
                  ["Fetch", `${source.metrics.fetchSuccess}%`],
                  ["Extraction", `${source.metrics.extraction}%`],
                  ["Null fields", `${source.metrics.nullRate}%`],
                  ["Freshness", `${source.metrics.freshnessLagHours}h`],
                  ["Rank", `${source.metrics.rankCoverage}%`],
                  ["Images", `${source.metrics.imageCoverage}%`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-muted/50 p-2.5">
                    <p className="text-[9px] uppercase text-muted-foreground">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed p-4 text-xs leading-5 text-muted-foreground">
                {source.status === "healthy"
                  ? "Live smoke test passed. Detailed field coverage appears after scheduled runs."
                  : source.credentialsRequired.length
                    ? `Requires ${source.credentialsRequired.join(" and ")}.`
                    : "Connector remains disabled until compliance and fixture checks pass."}
              </div>
            )}
            <div className="mt-4 border-t pt-3 text-[10px] leading-4 text-muted-foreground">
              <p>
                <strong>Compliance:</strong>{" "}
                {source.complianceStatus.replaceAll("_", " ")}
              </p>
              <p className="mt-1">
                <strong>Last success:</strong>{" "}
                {source.lastSuccessfulRunAt
                  ? new Date(source.lastSuccessfulRunAt).toLocaleString("en-IN")
                  : "Never"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
function Status({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.08em] ${status === "healthy" ? "bg-emerald-100 text-emerald-800" : status === "not_connected" ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-800"}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
