import { z } from "zod";

export const retailerConfigSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  country: z.string().length(2),
  currency: z.string().length(3),
  locale: z.string(),
  categoryUrls: z.array(z.url()).min(1),
  allowedRequestsPerMinute: z.number().int().min(1).max(60),
  reliabilityWeight: z.number().min(0).max(1),
  pagination: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("none") }),
    z.object({
      kind: z.literal("query"),
      parameter: z.string(),
      start: z.number().int(),
      maxPages: z.number().int().max(100),
    }),
    z.object({ kind: z.literal("next_link"), selector: z.string() }),
  ]),
  selectors: z.object({
    product: z.string(),
    title: z.string(),
    url: z.string(),
    brand: z.string().optional(),
    price: z.string(),
    originalPrice: z.string().optional(),
    image: z.string().optional(),
    rank: z.string().optional(),
    detailLink: z.string().optional(),
  }),
  detailSelectors: z
    .object({
      rating: z.string().optional(),
      reviewCount: z.string().optional(),
      availability: z.string().optional(),
      sizes: z.string().optional(),
    })
    .optional(),
});
export type RetailerConfig = z.infer<typeof retailerConfigSchema>;
export type CollectorObservation = {
  source: string;
  source_product_id: string;
  url: string;
  title: string;
  brand: string;
  price: number;
  original_price: number | null;
  currency: string;
  rating: number | null;
  review_count: number | null;
  rank: number | null;
  rank_type?:
    | "bestseller"
    | "marketplace_popularity"
    | "search_position"
    | "catalog_position";
  rank_context?: string;
  category: string;
  availability: "in_stock" | "out_of_stock" | "preorder" | "unknown";
  sizes_available: string[];
  image_url: string | null;
  observed_at: string;
  raw: Record<string, unknown>;
};
export type ConnectorStatus = {
  key: string;
  state: "healthy" | "not_connected" | "blocked" | "review_required";
  message: string;
};
export interface SourceAdapter {
  readonly key: string;
  status(): Promise<ConnectorStatus>;
  discoverCategories(): Promise<Array<{ name: string; url: string }>>;
  collect(limit?: number): Promise<CollectorObservation[]>;
}
