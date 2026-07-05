/**
 * Autocomplete-friendly href type. Project-specific generated types augment
 * this with known SvelteKit routes while preserving arbitrary string support.
 *
 * @example
 * ```ts
 * const value: AutoHref = "/auth/sign-in";
 * ```
 *
 * @since 0.1.0
 */
export type AutoHref = string & Record<never, never>;

/**
 * Strict app href type. Project-specific generated types augment this to the
 * app's known SvelteKit route union.
 *
 * @example
 * ```ts
 * const value: StrictAppHref = strict_href("/auth/sign-in");
 * ```
 *
 * @since 0.1.0
 */
export type StrictAppHref = string;

/**
 * Identity helper that gives editors a route-aware call site once generated
 * types are loaded.
 *
 * @example
 * ```ts
 * const destination = href("/auth/sign-in");
 * ```
 *
 * @since 0.1.0
 * @param value - Href string to return unchanged.
 * @returns The same href value.
 */
export function href<T extends string>(value: T): T {
  return value;
}

/**
 * Identity helper for projects that want generated types to reject unknown
 * internal app paths.
 *
 * @example
 * ```ts
 * const destination = strict_href("/dashboard");
 * ```
 *
 * @since 0.1.0
 * @param value - Strict app href to return unchanged.
 * @returns The same href value.
 */
export function strict_href<T extends string>(value: T): T {
  return value;
}

export type {
  AutoHrefManifest,
  RouteKind,
  RouteParam,
  RouteRecord,
} from "./manifest.ts";
export type {
  GenerateAutoHrefOptions,
  GenerateAutoHrefResult,
} from "./generator.ts";
export { generate_auto_href } from "./generator.ts";
export { render_html_data } from "./html-data-renderer.ts";
export type { ScanRoutesOptions } from "./route-scanner.ts";
export { scan_routes } from "./route-scanner.ts";
