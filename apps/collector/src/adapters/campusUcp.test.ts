import { describe, expect, it, vi } from "vitest";
import fixture from "../fixtures/campus-ucp-search.json";
import { CampusUcpAdapter } from "./campusUcp";

describe("Campus UCP catalog adapter", () => {
  it("maps a permissioned UCP product without treating relevance as sales rank", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify(fixture), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      ),
    );
    const rows = await new CampusUcpAdapter().collect(1);
    expect(rows).toMatchObject([
      {
        source: "campus-ucp",
        source_product_id: "9439744590055",
        price: 1079,
        original_price: 2999,
        currency: "INR",
        rank: null,
        category: "running shoes",
        availability: "in_stock",
        sizes_available: ["6", "7"],
      },
    ]);
    vi.unstubAllGlobals();
  });
});
