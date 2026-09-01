import { afterEach, describe, expect, it, vi } from "vitest";
import { AnysiteMarketplaceAdapter } from "./anysiteMarketplace";

describe("Anysite marketplace adapter", () => {
  afterEach(() => {
    delete process.env.ANYSITE_API_TOKEN;
    vi.unstubAllGlobals();
  });

  it("stays disabled without a token", async () => {
    const status = await new AnysiteMarketplaceAdapter("myntra").status();
    expect(status.state).toBe("not_connected");
  });

  it("maps Myntra popularity results and removes sponsored rows", async () => {
    process.env.ANYSITE_API_TOKEN = "test-token";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify([
            {
              id: "M1",
              name: "Leather Oxford Formal Shoes",
              brand: "Example",
              url: "https://www.myntra.com/formal-shoes/example/m1",
              price: 2499,
              list_price: 3999,
              rating: 4.4,
              rating_count: 310,
              sizes: ["7", "8", "9"],
              image: "https://example.com/m1.jpg",
            },
            {
              id: "AD1",
              name: "Sponsored Shoe",
              url: "https://www.myntra.com/formal-shoes/ad/ad1",
              price: 999,
              is_sponsored: true,
            },
          ]),
          { status: 200 },
        ),
      ),
    );
    const rows = await new AnysiteMarketplaceAdapter("myntra").collect(10);
    expect(rows).toMatchObject([
      {
        source: "myntra-anysite",
        source_product_id: "M1",
        rank: 1,
        rank_type: "marketplace_popularity",
        review_count: 310,
        sizes_available: ["7", "8", "9"],
      },
    ]);
  });
});
