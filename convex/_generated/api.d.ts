/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as dashboard from "../dashboard.js";
import type * as http from "../http.js";
import type * as ingestion from "../ingestion.js";
import type * as lib_access from "../lib/access.js";
import type * as liveSources from "../liveSources.js";
import type * as products from "../products.js";
import type * as reports from "../reports.js";
import type * as research from "../research.js";
import type * as seed from "../seed.js";
import type * as sources from "../sources.js";
import type * as trends from "../trends.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  dashboard: typeof dashboard;
  http: typeof http;
  ingestion: typeof ingestion;
  "lib/access": typeof lib_access;
  liveSources: typeof liveSources;
  products: typeof products;
  reports: typeof reports;
  research: typeof research;
  seed: typeof seed;
  sources: typeof sources;
  trends: typeof trends;
  workspaces: typeof workspaces;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
