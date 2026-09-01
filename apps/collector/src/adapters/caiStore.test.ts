import { describe, expect, it, vi } from "vitest";
import fixture from "../fixtures/cai-products.json";
import { CaiStoreAdapter } from "./caiStore";

describe("CAI public catalog adapter", () => {
  it("maps the permitted product JSON fixture", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.endsWith("robots.txt")
          ? new Response("User-agent: *\nAllow: /", { status: 200 })
          : new Response(JSON.stringify(fixture), {
              status: 200,
              headers: { "content-type": "application/json" },
            }),
      ),
    );
    const rows = await new CaiStoreAdapter().collect(1);
    expect(rows).toMatchObject([
      {
        source: "cai-store-public",
        source_product_id: "1001",
        price: 1499,
        original_price: 1999,
        rank: null,
        availability: "in_stock",
        sizes_available: ["36"],
      },
    ]);
    vi.unstubAllGlobals();
  });
});
