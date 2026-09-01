import { assertRobotsAllowed, requestHeaders } from "../compliance";
import type {
  CollectorObservation,
  ConnectorStatus,
  SourceAdapter,
} from "../types";

type ShopifyProduct = {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  images?: Array<{ src: string }>;
  variants: Array<{
    id: number;
    price: string;
    compare_at_price: string | null;
    available: boolean;
    title: string;
  }>;
};

export class CaiStoreAdapter implements SourceAdapter {
  readonly key = "cai-store-public";
  private readonly origin = "https://thecaistore.com";
  async status(): Promise<ConnectorStatus> {
    try {
      const [robots, agents] = await Promise.all([
        fetch(`${this.origin}/robots.txt`, { headers: requestHeaders() }),
        fetch(`${this.origin}/agents.md`, { headers: requestHeaders() }),
      ]);
      const text = await agents.text();
      return robots.ok &&
        agents.ok &&
        text.includes("Read-Only Browsing (No Authentication Required)")
        ? {
            key: this.key,
            state: "healthy",
            message:
              "robots.txt allows the catalog and agents.md explicitly permits read-only product JSON.",
          }
        : {
            key: this.key,
            state: "review_required",
            message:
              "The live permission documents did not match the approved fixture.",
          };
    } catch (error) {
      return {
        key: this.key,
        state: "blocked",
        message:
          error instanceof Error ? error.message : "Compliance check failed.",
      };
    }
  }
  async discoverCategories() {
    const url = `${this.origin}/collections/all`;
    await assertRobotsAllowed(url);
    return [
      {
        name: "All footwear",
        url: `${this.origin}/collections/all/products.json`,
      },
    ];
  }
  async collect(limit = 24): Promise<CollectorObservation[]> {
    const endpoint = `${this.origin}/collections/all/products.json?limit=${Math.min(limit, 250)}`;
    await assertRobotsAllowed(endpoint);
    const response = await fetch(endpoint, { headers: requestHeaders() });
    if (!response.ok)
      throw new Error(`CAI catalog returned HTTP ${response.status}`);
    const body = (await response.json()) as { products: ShopifyProduct[] };
    const observedAt = new Date().toISOString();
    return body.products.slice(0, limit).map((product, rank) => {
      const available = product.variants.filter((v) => v.available);
      const variant = available[0] ?? product.variants[0];
      return {
        source: this.key,
        source_product_id: String(product.id),
        url: `${this.origin}/products/${product.handle}`,
        title: product.title,
        brand: product.vendor || "The CAI Store",
        price: Number(variant?.price ?? 0),
        original_price: variant?.compare_at_price
          ? Number(variant.compare_at_price)
          : null,
        currency: "INR",
        rating: null,
        review_count: null,
        rank: rank + 1,
        category: product.product_type || "footwear",
        availability: available.length ? "in_stock" : "out_of_stock",
        sizes_available: available.map((v) => v.title),
        image_url: product.images?.[0]?.src ?? null,
        observed_at: observedAt,
        raw: {
          productId: product.id,
          variantCount: product.variants.length,
          publicCatalog: true,
        },
      };
    });
  }
}
