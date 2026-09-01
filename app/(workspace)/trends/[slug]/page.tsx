"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useWorkspace } from "@/lib/useWorkspace";
import { ArrowLeft, ExternalLink, Info, Layers3, Tag } from "lucide-react";
import {
  Confidence,
  LoadingPage,
  PageHeader,
  Score,
  ShoeArt,
  Sparkline,
  StageBadge,
} from "@/components/MarketUI";

export default function TrendDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { workspaceSlug, loading } = useWorkspace();
  const data = useQuery(
    api.trends.detail,
    loading ? "skip" : { workspaceSlug, slug },
  );
  if (loading || data === undefined) return <LoadingPage />;
  if (!data) return <p>Trend not found.</p>;
  const components = Object.entries(data.score?.components ?? {});
  return (
    <>
      <Link
        href="/trends"
        className="mb-5 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All trends
      </Link>
      <PageHeader
        eyebrow={`${data.cluster.primaryCategory} · ${data.cluster.productType.replaceAll("_", " ")}`}
        title={data.cluster.name}
        description="Evidence, score components, supporting products, and the separation between demand and supply."
      >
        <StageBadge stage={data.score?.stage} />
      </PageHeader>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <div className="data-card p-5">
          <ShoeArt variant={1} className="h-72" />
          <div className="mt-5 grid grid-cols-3 gap-2">
            <Score value={data.score?.score} label="Trend" />
            <Score
              value={data.opportunity?.score}
              label="Opportunity"
              tone="lime"
            />
            <Score value={data.score?.confidence} label="Confidence" />
          </div>
          <div className="mt-5 rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">
                90-day estimated signal
              </p>
              <Confidence value={data.score?.confidence ?? 0} />
            </div>
            <Sparkline
              values={[35, 38, 42, 49, 58, 66, 73, data.score?.score ?? 50]}
              className="mt-3 h-24"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>3 Jun</span>
              <span>31 Aug</span>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="data-card p-5">
            <p className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">
              Why it moved
            </p>
            <p className="mt-3 text-sm leading-6">{data.score?.explanation}</p>
            <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <Info className="mr-1 inline h-3.5 w-3.5" />
              This is estimated demand from synthetic observations—not unit
              sales.
            </div>
          </div>
          <div className="data-card p-5">
            <div className="flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-[#2f726b]" />
              <h2 className="font-semibold">Demand vs supply</h2>
            </div>
            <div className="mt-5 space-y-4">
              <Bar
                label="Estimated demand"
                value={data.score?.score ?? 0}
                colour="bg-[#2f8278]"
              />
              <Bar
                label="Supply saturation"
                value={data.opportunity?.saturation ?? 0}
                colour="bg-amber-500"
              />
              <Bar
                label="Whitespace"
                value={100 - (data.opportunity?.saturation ?? 0)}
                colour="bg-[#b4d94f]"
              />
            </div>
          </div>
        </div>
      </div>
      <section className="mt-7 grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
        <div className="data-card p-5">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-[#2f726b]" />
            <h2 className="font-display text-xl font-semibold">
              Score decomposition
            </h2>
          </div>
          <div className="mt-4 space-y-3">
            {components.map(([key, value]) => (
              <Bar
                key={key}
                label={key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (c) => c.toUpperCase())}
                value={Number(value ?? 0)}
                colour={
                  key === "discountPenalty" ? "bg-orange-500" : "bg-[#2f8278]"
                }
              />
            ))}
          </div>
          <p className="mt-4 text-[10px] text-muted-foreground">
            Model {data.score?.version} · components stored with the historical
            result
          </p>
        </div>
        <div className="data-card p-5">
          <h2 className="font-display text-xl font-semibold">
            Supporting products
          </h2>
          <div className="mt-4 divide-y">
            {data.products.map((item: any, index: number) => (
              <Link
                href={`/products/${item.product._id}`}
                key={item.product._id}
                className="flex items-center gap-3 py-3"
              >
                <ShoeArt variant={index + 2} className="h-16 w-24 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {item.product.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.product.brand} · ₹
                    {item.latest?.price.toLocaleString("en-IN")}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#2f726b]">
                  {Math.round(item.membershipScore * 100)}% fit
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="data-card mt-4 p-5">
        <h2 className="font-display text-xl font-semibold">Evidence ledger</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="border-b text-[10px] uppercase tracking-[.1em] text-muted-foreground">
              <tr>
                <th className="pb-3">Observed</th>
                <th>Signal</th>
                <th>Summary</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.evidence.map((e: any) => (
                <tr key={e._id}>
                  <td className="py-3 tabular-nums">
                    {new Date(e.observedAt).toLocaleDateString("en-IN")}
                  </td>
                  <td>{e.kind.replaceAll("_", " ")}</td>
                  <td>{e.summary}</td>
                  <td>
                    <a
                      href={e.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[#2f726b]"
                    >
                      Observation <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
function Bar({
  label,
  value,
  colour,
}: {
  label: string;
  value: number;
  colour: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{Math.round(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${colour}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
