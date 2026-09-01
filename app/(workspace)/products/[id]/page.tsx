"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useWorkspace } from "@/lib/useWorkspace";
import { ArrowLeft, ExternalLink, PencilLine, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LoadingPage,
  PageHeader,
  ShoeArt,
  Sparkline,
} from "@/components/MarketUI";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { workspaceSlug, loading } = useWorkspace();
  const data = useQuery(
    api.products.detail,
    loading
      ? "skip"
      : { workspaceSlug, productId: id as Id<"canonicalProducts"> },
  );
  if (loading || data === undefined) return <LoadingPage />;
  if (!data) return <p>Product not found.</p>;
  const allSnapshots = data.listings
    .flatMap((l: any) => l.snapshots)
    .sort((a: any, b: any) => a.observedAt - b.observedAt);
  const latest = allSnapshots.at(-1);
  const primaryImage = data.listings.find((item: any) => item.listing.imageUrl)
    ?.listing.imageUrl;
  return (
    <>
      <Link
        href="/products"
        className="mb-5 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All products
      </Link>
      <PageHeader
        eyebrow={`${data.product.brand} · ${data.cluster?.primaryCategory ?? "footwear"}`}
        title={data.product.title}
        description="Source observations, historical change, matching, cluster membership, and correctable attributes."
      />
      <div className="grid gap-4 xl:grid-cols-[.75fr_1.25fr]">
        <div className="data-card p-5">
          {primaryImage ? (
            <div className="relative h-72 overflow-hidden rounded-2xl bg-white">
              <Image
                src={primaryImage}
                alt={data.product.title}
                fill
                sizes="(min-width: 1280px) 35vw, 90vw"
                className="object-contain"
                priority
              />
            </div>
          ) : (
            <ShoeArt variant={2} className="h-72" />
          )}
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              ["Current price", `₹${latest?.price.toLocaleString("en-IN")}`],
              ["Current rank", `#${latest?.rank ?? "—"}`],
              ["Rating", latest?.rating?.toFixed(1) ?? "—"],
              ["Sizes live", String(latest?.sizesAvailable.length ?? 0)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border p-3">
                <p className="text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-muted/50 p-3 text-xs leading-5">
            <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-[#2f726b]" />
            Attributes are rule-extracted at{" "}
            {Math.round((data.attributes?.confidence ?? 0) * 100)}% confidence
            and can be human-corrected.
          </div>
        </div>
        <div className="space-y-4">
          <Timeline
            title="Rank timeline"
            values={allSnapshots.map((s: any) => 101 - (s.rank ?? 100))}
            labels="Higher line means stronger normalized rank"
          />
          <Timeline
            title="Review timeline"
            values={allSnapshots.map((s: any) => s.reviewCount ?? 0)}
            labels="Cumulative review count; velocity is log-transformed in scoring"
          />
          <Timeline
            title="Price timeline"
            values={allSnapshots.map((s: any) => s.price)}
            labels="Observed selling price in INR"
          />
        </div>
      </div>
      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="data-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">
              Footwear attributes
            </h2>
            <Button
              size="sm"
              variant="outline"
              disabled
              title="Demo attributes are read-only"
            >
              <PencilLine />
              Demo read-only
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {Object.entries(data.attributes?.attributes ?? {})
              .filter(([, v]) => v !== null && (!Array.isArray(v) || v.length))
              .map(([key, value]) => (
                <div key={key} className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[9px] font-bold uppercase tracking-[.1em] text-muted-foreground">
                    {key.replace(/([A-Z])/g, " $1")}
                  </p>
                  <p className="mt-1 text-xs font-semibold capitalize">
                    {Array.isArray(value)
                      ? value.join(", ").replaceAll("_", " ")
                      : String(value).replaceAll("_", " ")}
                  </p>
                </div>
              ))}
          </div>
        </div>
        <div className="data-card p-5">
          <h2 className="font-display text-xl font-semibold">
            Source observations
          </h2>
          <div className="mt-4 space-y-3">
            {data.listings.map((item: any) => (
              <div key={item.listing._id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{item.source?.name}</p>
                  <a
                    href={item.listing.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#2f726b]"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.snapshots.length} observations · first seen{" "}
                  {new Date(item.listing.firstSeenAt).toLocaleDateString(
                    "en-IN",
                  )}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">Style cluster:</strong>{" "}
            {data.cluster?.name ?? "Unassigned"}
            <br />
            <strong className="text-foreground">Exact matches:</strong>{" "}
            {data.matches.length} reviewed/pending links
          </div>
        </div>
      </section>
    </>
  );
}
function Timeline({
  title,
  values,
  labels,
}: {
  title: string;
  values: number[];
  labels: string;
}) {
  return (
    <div className="data-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-[10px] text-muted-foreground">30 days</span>
      </div>
      <Sparkline values={values} className="mt-2 h-16" />
      <p className="mt-1 text-[10px] text-muted-foreground">{labels}</p>
    </div>
  );
}
