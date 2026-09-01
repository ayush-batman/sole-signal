import Papa from "papaparse";
import { z } from "zod";

export const observationColumns = [
  "source",
  "source_product_id",
  "url",
  "title",
  "brand",
  "price",
  "original_price",
  "currency",
  "rating",
  "review_count",
  "rank",
  "category",
  "availability",
  "sizes_available",
  "image_url",
  "observed_at",
] as const;

const optionalNumber = z.preprocess(
  (value) => (value === "" || value == null ? null : Number(value)),
  z.number().finite().nonnegative().nullable(),
);
const observationRowSchema = z.object({
  source: z.string().trim().min(1, "Source is required").max(80),
  source_product_id: z
    .string()
    .trim()
    .min(1, "Source product ID is required")
    .max(200),
  url: z.url({ protocol: /^https?$/ }),
  title: z.string().trim().min(2, "Title is required").max(500),
  brand: z.string().trim().min(1).max(120),
  price: z.preprocess(Number, z.number().finite().nonnegative()),
  original_price: optionalNumber,
  currency: z
    .string()
    .trim()
    .length(3)
    .transform((v) => v.toUpperCase()),
  rating: optionalNumber.refine(
    (v) => v === null || v <= 5,
    "Rating must be between 0 and 5",
  ),
  review_count: optionalNumber,
  rank: optionalNumber.refine(
    (v) => v === null || Number.isInteger(v),
    "Rank must be a whole number",
  ),
  category: z.string().trim().min(1).max(160),
  availability: z.enum(["in_stock", "out_of_stock", "preorder", "unknown"]),
  sizes_available: z.string().transform((value) =>
    value
      .split(/[|,]/)
      .map((size) => size.trim())
      .filter(Boolean),
  ),
  image_url: z
    .union([z.literal(""), z.url({ protocol: /^https?$/ })])
    .transform((value) => value || null),
  observed_at: z.iso
    .datetime({ offset: true })
    .transform((value) => new Date(value).toISOString()),
});

export type ObservationRow = z.infer<typeof observationRowSchema>;
export type CsvRowError = {
  row: number;
  field: string;
  message: string;
  value: unknown;
};
export type CsvParseResult = {
  valid: ObservationRow[];
  errors: CsvRowError[];
  headers: string[];
};

export function parseObservationCsv(input: string): CsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(input.trim(), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase(),
  });
  const headers = parsed.meta.fields ?? [];
  const errors: CsvRowError[] = parsed.errors.map((error) => ({
    row: (error.row ?? 0) + 2,
    field: "row",
    message: error.message,
    value: null,
  }));
  for (const column of observationColumns)
    if (!headers.includes(column))
      errors.push({
        row: 1,
        field: column,
        message: `Missing required column: ${column}`,
        value: null,
      });
  const valid: ObservationRow[] = [];
  parsed.data.forEach((row, index) => {
    const result = observationRowSchema.safeParse(row);
    if (result.success) valid.push(result.data);
    else
      result.error.issues.forEach((issue) =>
        errors.push({
          row: index + 2,
          field: issue.path.join(".") || "row",
          message: issue.message,
          value: row[issue.path[0] as string],
        }),
      );
  });
  return {
    valid: errors.some((e) => e.row === 1) ? [] : valid,
    errors,
    headers,
  };
}

export function observationKey(
  row: ObservationRow,
  workspaceKey: string,
): string {
  return [
    workspaceKey,
    row.source.toLowerCase(),
    row.source_product_id,
    row.observed_at,
    "IN",
  ].join("::");
}

export const csvTemplate = `${observationColumns.join(",")}\ndemo,SKU-001,https://example.com/shoe,Retro Court Sneaker,Signal Works,1299,1599,INR,4.3,120,18,men casual,in_stock,7|8|9,https://example.com/shoe.jpg,2026-08-31T00:00:00+05:30`;
