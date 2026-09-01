import { z } from "zod";

export const audiences = [
  "men",
  "women",
  "unisex",
  "boys",
  "girls",
  "kids",
] as const;
export const primaryCategories = [
  "casual",
  "formal",
  "performance",
  "comfort",
  "ethnic",
  "safety",
  "school",
  "outdoor",
] as const;
export const productTypes = [
  "sneaker",
  "running_shoe",
  "walking_shoe",
  "training_shoe",
  "loafer",
  "oxford",
  "derby",
  "monk_strap",
  "moccasin",
  "sandal",
  "floater",
  "slipper",
  "flip_flop",
  "slide",
  "clog",
  "mule",
  "ballet_flat",
  "pump",
  "heel",
  "wedge",
  "boot",
  "jutti",
  "mojari",
  "kolhapuri",
  "school_shoe",
  "safety_shoe",
] as const;
export const sports = [
  "running",
  "walking",
  "gym",
  "badminton",
  "tennis",
  "pickleball",
  "padel",
  "football",
  "cricket",
  "basketball",
  "hiking",
  "trekking",
] as const;
export const aestheticTags = [
  "retro_terrace",
  "minimalist",
  "chunky",
  "dad_shoe",
  "court_inspired",
  "gorpcore",
  "barefoot",
  "quiet_luxury",
  "streetwear",
  "athleisure",
  "comfort_first",
  "orthopaedic",
  "monsoon",
  "resort",
  "wedding",
  "festive",
  "heritage_ethnic",
] as const;

export const footwearAttributesSchema = z.object({
  audience: z.enum(audiences),
  primaryCategory: z.enum(primaryCategories),
  productType: z.enum(productTypes),
  sport: z.enum(sports).nullable().default(null),
  silhouette: z.string().min(1).max(80),
  topHeight: z.enum(["low", "mid", "high"]).nullable().default(null),
  toeShape: z
    .enum(["round", "almond", "square", "pointed", "open"])
    .nullable()
    .default(null),
  closure: z
    .enum(["lace", "slip_on", "buckle", "hook_loop", "zip", "elastic", "none"])
    .nullable()
    .default(null),
  heelType: z.string().max(60).nullable().default(null),
  heelHeightMm: z.number().min(0).max(250).nullable().default(null),
  soleThicknessMm: z.number().min(0).max(150).nullable().default(null),
  soleConstruction: z.string().max(80).nullable().default(null),
  upperMaterial: z.string().max(80).nullable().default(null),
  liningMaterial: z.string().max(80).nullable().default(null),
  soleMaterial: z.string().max(80).nullable().default(null),
  primaryColour: z.string().min(1).max(50),
  secondaryColours: z.array(z.string().max(50)).max(8).default([]),
  pattern: z.string().max(80).nullable().default(null),
  texture: z.string().max(80).nullable().default(null),
  embellishments: z.array(z.string().max(80)).max(10).default([]),
  cushioning: z.string().max(80).nullable().default(null),
  archSupport: z.boolean().nullable().default(null),
  waterproof: z.boolean().nullable().default(null),
  breathable: z.boolean().nullable().default(null),
  wideFit: z.boolean().nullable().default(null),
  lightweight: z.boolean().nullable().default(null),
  slipResistant: z.boolean().nullable().default(null),
  nonMarking: z.boolean().nullable().default(null),
  aestheticTags: z.array(z.enum(aestheticTags)).max(8).default([]),
});

export type FootwearAttributes = z.infer<typeof footwearAttributesSchema>;

const rules: Array<{ pattern: RegExp; value: Partial<FootwearAttributes> }> = [
  {
    pattern: /retro|terrace|gum sole/i,
    value: {
      productType: "sneaker",
      primaryCategory: "casual",
      aestheticTags: ["retro_terrace"],
    },
  },
  {
    pattern: /running/i,
    value: {
      productType: "running_shoe",
      primaryCategory: "performance",
      sport: "running",
      aestheticTags: ["athleisure"],
    },
  },
  {
    pattern: /walking/i,
    value: {
      productType: "walking_shoe",
      primaryCategory: "comfort",
      sport: "walking",
      aestheticTags: ["comfort_first"],
    },
  },
  {
    pattern: /clog/i,
    value: {
      productType: "clog",
      primaryCategory: "comfort",
      aestheticTags: ["comfort_first"],
    },
  },
  {
    pattern: /slipper|chappal/i,
    value: {
      productType: "slipper",
      primaryCategory: "comfort",
      aestheticTags: ["comfort_first"],
    },
  },
  {
    pattern: /formal|oxford/i,
    value: {
      productType: "oxford",
      primaryCategory: "formal",
      aestheticTags: ["minimalist"],
    },
  },
  {
    pattern: /sandal/i,
    value: {
      productType: "sandal",
      primaryCategory: "casual",
      aestheticTags: ["resort"],
    },
  },
  {
    pattern: /court|tennis/i,
    value: {
      productType: "sneaker",
      primaryCategory: "casual",
      aestheticTags: ["court_inspired"],
    },
  },
];

export function inferAttributes(
  title: string,
  category = "",
): FootwearAttributes {
  const text = `${title} ${category}`;
  const matched = rules.find((rule) => rule.pattern.test(text))?.value ?? {};
  const audience = /women|ladies|female/i.test(text)
    ? "women"
    : /kids|boys|girls/i.test(text)
      ? "kids"
      : "men";
  const primaryColour =
    [
      "black",
      "white",
      "blue",
      "green",
      "brown",
      "tan",
      "beige",
      "red",
      "pink",
      "grey",
      "navy",
    ].find((colour) => new RegExp(`\\b${colour}\\b`, "i").test(text)) ??
    "multi";
  return footwearAttributesSchema.parse({
    audience,
    primaryCategory: matched.primaryCategory ?? "casual",
    productType: matched.productType ?? "sneaker",
    sport: matched.sport ?? null,
    silhouette: /low[ -]?profile/i.test(text)
      ? "low-profile"
      : /chunky|platform/i.test(text)
        ? "chunky"
        : "standard",
    primaryColour,
    aestheticTags:
      matched.aestheticTags ?? (/chunky/i.test(text) ? ["chunky"] : []),
  });
}
