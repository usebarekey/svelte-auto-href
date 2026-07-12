/**
 * Type registry augmented by each project's generated declarations.
 *
 * @example
 * ```ts
 * declare module "svelte-auto-href" {
 *   interface GeneratedHrefTypes {
 *     auto_href: "/" | (string & {});
 *     strict_app_href: "/";
 *   }
 * }
 * ```
 *
 * @since 1.0.2
 */
export interface GeneratedHrefTypes {}

/**
 * Autocomplete-friendly href type resolved from the generated project types
 * while preserving arbitrary string support.
 *
 * @example
 * ```ts
 * const value: AutoHref = "/auth/sign-in";
 * ```
 *
 * @since 0.1.0
 */
export type AutoHref = GeneratedHrefTypes extends {
	auto_href: infer Href extends string;
}
	? Href
	: string & Record<never, never>;

/**
 * Strict app href type resolved from the project's generated route union.
 *
 * @example
 * ```ts
 * const value: StrictAppHref = strict_href("/auth/sign-in");
 * ```
 *
 * @since 0.1.0
 */
export type StrictAppHref = GeneratedHrefTypes extends {
	strict_app_href: infer Href extends string;
}
	? Href
	: string;

/**
 * Identity helper that gives editors a route-aware call site once generated
 * types are loaded.
 *
 * @example
 * ```ts
 * const destination = literal_href("/auth/sign-in");
 * ```
 *
 * @since 0.1.0
 * @param value - Href string to return unchanged.
 * @returns The same href value.
 */
export function literal_href<T extends AutoHref>(value: T): T {
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
export function strict_href<T extends StrictAppHref>(value: T): T {
	return value;
}

export type { AutoHrefManifest, RouteKind, RouteParam, RouteRecord } from "./manifest.ts";
export type { AutoHrefOptions } from "./vite.ts";
export { href } from "./vite.ts";
export type {
	AutoHrefCompletion,
	AutoHrefCompletionOptions,
	AutoHrefDiagnostic,
} from "./editor.ts";
export { diagnose_href, get_href_completions, is_known_app_href } from "./editor.ts";
export type { GenerateAutoHrefOptions, GenerateAutoHrefResult } from "./generator.ts";
export { generate_auto_href } from "./generator.ts";
export { render_types } from "./type-renderer.ts";
export { render_html_data } from "./html-data-renderer.ts";
export type { ScanRoutesOptions } from "./route-scanner.ts";
export { route_segments_from_path, scan_routes } from "./route-scanner.ts";
