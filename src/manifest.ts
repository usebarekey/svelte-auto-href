/**
 * Route kind represented in the generated autocomplete manifest.
 *
 * @example
 * ```ts
 * const kind: RouteKind = "page";
 * ```
 *
 * @since 0.1.0
 */
export type RouteKind = "page" | "endpoint" | "page-and-endpoint";

/**
 * Dynamic parameter metadata extracted from a SvelteKit route segment.
 *
 * @example
 * ```ts
 * const param: RouteParam = {
 *   name: "slug",
 *   optional: false,
 *   rest: false,
 * };
 * ```
 *
 * @since 0.1.0
 */
export interface RouteParam {
	/** Parameter name as it appears in the route segment. */
	name: string;

	/** Optional matcher name from `[name=matcher]` segments. */
	matcher?: string;

	/** Whether the parameter comes from an optional `[[name]]` segment. */
	optional: boolean;

	/** Whether the parameter comes from a rest `[...name]` segment. */
	rest: boolean;
}

/**
 * A route record written to the generated manifest.
 *
 * @example
 * ```ts
 * const route: RouteRecord = {
 *   id: "/blog/[slug]",
 *   pathname: "/blog/[slug]",
 *   route_kind: "page",
 *   params: [{ name: "slug", optional: false, rest: false }],
 *   templates: ["/blog/${string}"],
 *   completions: ["/blog/${slug}"],
 *   entries: ["/blog/hello-world"],
 * };
 * ```
 *
 * @since 0.1.0
 */
export interface RouteRecord {
	/** SvelteKit route ID, preserving route groups. */
	id: string;

	/** URL-facing route pattern with route groups removed. */
	pathname: string;

	/** Whether the route is backed by a page, endpoint, or both. */
	route_kind: RouteKind;

	/** Dynamic route params found in the path. */
	params: RouteParam[];

	/** Template-literal path shapes, such as `/blog/${string}`. */
	templates: string[];

	/** Snippet-friendly completions, such as `/blog/${slug}`. */
	completions: string[];

	/** Concrete hrefs statically extracted from literal `entries()` exports. */
	entries: string[];
}

/**
 * Generated manifest consumed by editor integrations and tests.
 *
 * @example
 * ```ts
 * const manifest: AutoHrefManifest = {
 *   version: 1,
 *   routes_dir: "src/routes",
 *   routes: [],
 * };
 * ```
 *
 * @since 0.1.0
 */
export interface AutoHrefManifest {
	/** Manifest schema version. */
	version: 1;

	/** Route directory used for scanning. */
	routes_dir: string;

	/** Routes discovered under `routes_dir`. */
	routes: RouteRecord[];
}
