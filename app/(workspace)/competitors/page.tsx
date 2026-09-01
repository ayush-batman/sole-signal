"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useWorkspace } from "@/lib/useWorkspace";
import {
  DemoBadge,
  LoadingPage,
  PageHeader,
  ShoeArt,
} from "@/components/MarketUI";

export default function Competitors() {
  const { workspaceSlug, loading } = useWorkspace();
  const rows = useQuery(
    api.products.list,
    loading ? "skip" : { workspaceSlug },
  );
  if (loading || !rows) return <LoadingPage />;
  const brands = Object.values(
    rows.reduce((acc: any, row: any) => {
      const name = row.product?.brand ?? "Unknown";
      acc[name] ??= { name, count: 0, prices: [], discounts: [], movers: [] };
      acc[name].count++;
      acc[name].prices.push(row.latest?.price ?? 0);
      acc[name].discounts.push(
        row.latest?.originalPrice
          ? Math.round(
              ((row.latest.originalPrice - row.latest.price) /
                row.latest.originalPrice) *
                100,
            )
          : 0,
      );
      acc[name].movers.push(row);
      return acc;
    }, {}),
  ).slice(0, 6) as any[];
  return (
    <>
      <PageHeader
        eyebrow="Assortment intelligence"
        title="Competitors"
        description="Compare price architecture, discount share, assortment direction, and current movers."
      >
        <DemoBadge />
      </PageHeader>
      <div className="data-card overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-xs">
          <thead className="border-b bg-muted/40 text-[10px] uppercase tracking-[.1em] text-muted-foreground">
            <tr>
              <th className="p-4">Brand</th>
              <th>Assortment</th>
              <th>Average price</th>
              <th>Discount share</th>
              <th>Top mover</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {brands.map((brand: any, index: number) => {
              const mover = brand.movers.sort(
                (a: any, b: any) =>
                  (b.score?.score ?? 0) - (a.score?.score ?? 0),
              )[0];
              const avg = Math.round(
                brand.prices.reduce((a: number, b: number) => a + b, 0) /
                  brand.prices.length,
              );
              const discount = Math.round(
                brand.discounts.reduce((a: number, b: number) => a + b, 0) /
                  brand.discounts.length,
              );
              return (
                <tr key={brand.name}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <ShoeArt
                        variant={index}
                        className="h-12 w-[72px] rounded-lg"
                      />
                      <span className="font-semibold">{brand.name}</span>
                    </div>
                  </td>
                  <td>{brand.count} products</td>
                  <td className="font-semibold">
                    ₹{avg.toLocaleString("en-IN")}
                  </td>
                  <td>{discount}%</td>
                  <td className="max-w-[220px] truncate">
                    {mover?.listing.title}
                  </td>
                  <td
                    className={
                      mover?.score?.stage === "declining"
                        ? "text-rose-600"
                        : "text-emerald-700"
                    }
                  >
                    {mover?.score?.stage?.replaceAll("_", " ") ?? "stable"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <MixCard
          title="Price architecture"
          items={[
            ["Below ₹1,500", 45],
            ["₹1,500–₹2,999", 38],
            ["₹3,000+", 17],
          ]}
        />
        <MixCard
          title="Category mix"
          items={[
            ["Casual", 54],
            ["Comfort", 31],
            ["Formal", 15],
          ]}
        />
        <MixCard
          title="Colour mix"
          items={[
            ["Neutrals", 62],
            ["Blue / green", 23],
            ["Bright", 15],
          ]}
        />
      </div>
    </>
  );
}
function MixCard({
  title,
  items,
}: {
  title: string;
  items: [string, number][];
}) {
  return (
    <div className="data-card p-5">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <div className="mt-5 space-y-4">
        {items.map(([label, value]) => (
          <div key={label}>
            <div className="mb-1.5 flex justify-between text-xs">
              <span>{label}</span>
              <span className="font-semibold">{value}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[#2f8278]"
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
