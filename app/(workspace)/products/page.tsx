"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/lib/useWorkspace";
import {
  Delta,
  DemoBadge,
  LoadingPage,
  PageHeader,
  ShoeArt,
  StageBadge,
} from "@/components/MarketUI";

export default function Products() {
  const { workspaceSlug, loading } = useWorkspace();
  const rows = useQuery(
    api.products.list,
    loading ? "skip" : { workspaceSlug },
  );
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () =>
      rows?.filter((r: any) =>
        `${r.listing.title} ${r.listing.brand} ${r.listing.category}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ) ?? [],
    [rows, search],
  );
  if (loading || !rows) return <LoadingPage />;
  return (
    <>
      <PageHeader
        eyebrow="Observation catalog"
        title="Products"
        description="A dense, source-aware view of every current listing and its latest historical change."
      >
        <DemoBadge />
      </PageHeader>
      <div className="data-card mb-4 flex items-center gap-3 p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product, brand, source, category…"
            className="pl-9"
          />
        </div>
        <button className="flex h-10 items-center gap-2 rounded-lg border px-3 text-xs font-semibold">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
      </div>
      <div className="data-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-xs">
            <thead className="border-b bg-muted/40 text-[10px] uppercase tracking-[.08em] text-muted-foreground">
              <tr>
                {[
                  "Product",
                  "Source",
                  "Category",
                  "Price",
                  "Discount",
                  "Rank",
                  "Rank Δ",
                  "Rating",
                  "Reviews Δ",
                  "Sizes",
                  "Trend",
                  "Confidence",
                  "Observed",
                ].map((h) => (
                  <th className="px-3 py-3" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((row: any, index: number) => {
                const discount = row.latest?.originalPrice
                  ? Math.round(
                      ((row.latest.originalPrice - row.latest.price) /
                        row.latest.originalPrice) *
                        100,
                    )
                  : 0;
                return (
                  <tr
                    key={row.listing._id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-3 py-3">
                      <Link
                        href={`/products/${row.product?._id}`}
                        className="flex items-center gap-3"
                      >
                        {row.listing.imageUrl ? (
                          <span className="relative h-12 w-[72px] shrink-0 overflow-hidden rounded-lg bg-white">
                            <Image
                              src={row.listing.imageUrl}
                              alt={row.listing.title}
                              fill
                              sizes="72px"
                              className="object-contain"
                            />
                          </span>
                        ) : (
                          <ShoeArt
                            variant={index}
                            className="h-12 w-[72px] shrink-0 rounded-lg"
                          />
                        )}
                        <div className="max-w-[250px]">
                          <p className="truncate font-semibold">
                            {row.listing.title}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {row.listing.brand}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-3">{row.source?.name}</td>
                    <td className="px-3 capitalize">{row.listing.category}</td>
                    <td className="px-3 font-semibold tabular-nums">
                      ₹{row.latest?.price.toLocaleString("en-IN")}
                    </td>
                    <td className="px-3">{discount}%</td>
                    <td className="px-3 font-semibold tabular-nums">
                      #{row.latest?.rank ?? "—"}
                    </td>
                    <td className="px-3">
                      <Delta value={row.rankChange ?? 0} />
                    </td>
                    <td className="px-3">
                      {row.latest?.rating?.toFixed(1) ?? "—"}
                    </td>
                    <td className="px-3">
                      <Delta value={row.reviewChange ?? 0} />
                    </td>
                    <td className="px-3">
                      {row.latest?.sizesAvailable.length ?? 0}
                    </td>
                    <td className="px-3">
                      <StageBadge stage={row.score?.stage} />
                    </td>
                    <td className="px-3">{row.score?.confidence ?? "—"}%</td>
                    <td className="px-3 text-muted-foreground">
                      {row.latest
                        ? new Date(row.latest.observedAt).toLocaleDateString(
                            "en-IN",
                          )
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
          <span>{filtered.length} listings</span>
          <span>All values are observations, not sales</span>
        </div>
      </div>
    </>
  );
}
