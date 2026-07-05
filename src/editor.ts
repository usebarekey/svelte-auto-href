import type { AutoHrefManifest, RouteKind, RouteRecord } from "./manifest.ts";

/**
 * Completion item derived from the generated route manifest.
 *
 * @example
 * ```ts
 * const completion: AutoHrefCompletion = {
 *   label: "/auth/sign-in",
 *   insert_text: "/auth/sign-in",
 *   kind: "route",
 *   route_id: "/auth/sign-in",
 *   route_kind: "page",
 * };
 * ```
 *
 * @since 0.1.0
 */
export interface AutoHrefCompletion {
  /** Text shown in the editor completion menu. */
  label: string;

  /** Text inserted into the href-like string. */
  insert_text: string;

  /** Source of the completion. */
  kind: "route" | "entry" | "pattern";

  /** SvelteKit route ID that produced this completion. */
  route_id: string;

  /** Whether the route is a page, endpoint, or both. */
  route_kind: RouteKind;
}

/**
 * Diagnostic for a likely misspelled internal app href.
 *
 * @example
 * ```ts
 * const diagnostic: AutoHrefDiagnostic = {
 *   href: "/auth/sing-in",
 *   message: "Unknown SvelteKit route href: /auth/sing-in",
 * };
 * ```
 *
 * @since 0.1.0
 */
export interface AutoHrefDiagnostic {
  /** Original href-like value that was checked. */
  href: string;

  /** Human-readable diagnostic message. */
  message: string;
}

/**
 * Options for manifest-backed completion generation.
 *
 * @example
 * ```ts
 * const options: AutoHrefCompletionOptions = {
 *   include_endpoints: false,
 * };
 * ```
 *
 * @since 0.1.0
 */
export interface AutoHrefCompletionOptions {
  /** Whether endpoint routes should be returned. Defaults to `true`. */
  include_endpoints?: boolean;
}

/**
 * Builds completion items for editor integrations from a generated manifest.
 *
 * @example
 * ```ts
 * const completions = get_href_completions(manifest);
 * ```
 *
 * @since 0.1.0
 * @param manifest - Generated route manifest.
 * @param options - Completion filtering options.
 * @returns Completion items sorted by label.
 */
export function get_href_completions(
  manifest: AutoHrefManifest,
  options: AutoHrefCompletionOptions = {},
): AutoHrefCompletion[] {
  const include_endpoints = options.include_endpoints ?? true;
  const completions = new Map<string, AutoHrefCompletion>();

  for (const route of manifest.routes) {
    if (!include_endpoints && route_is_endpoint_only(route)) {
      continue;
    }

    add_route_completions(completions, route);
  }

  return [...completions.values()].sort((left, right) =>
    left.label.localeCompare(right.label)
  );
}

/**
 * Checks whether a string is a known internal SvelteKit href according to the
 * generated manifest.
 *
 * @example
 * ```ts
 * if (is_known_app_href(manifest, "/auth/sign-in")) {
 *   console.log("known route");
 * }
 * ```
 *
 * @since 0.1.0
 * @param manifest - Generated route manifest.
 * @param href - Href-like string to check.
 * @returns Whether the string is an internal route known to the manifest.
 */
export function is_known_app_href(
  manifest: AutoHrefManifest,
  href: string,
): boolean {
  const pathname = get_internal_pathname(href);

  if (!pathname) {
    return false;
  }

  return manifest.routes.some((route) =>
    route_matches_pathname(route, pathname)
  );
}

/**
 * Produces a diagnostic for clear app-internal route typos while ignoring
 * external URLs, asset-like paths, and custom schemes.
 *
 * @example
 * ```ts
 * const diagnostic = diagnose_href(manifest, "/auth/sing-in");
 * ```
 *
 * @since 0.1.0
 * @param manifest - Generated route manifest.
 * @param href - Href-like string to diagnose.
 * @returns A diagnostic when the href looks internal and unknown.
 */
export function diagnose_href(
  manifest: AutoHrefManifest,
  href: string,
): AutoHrefDiagnostic | undefined {
  const pathname = get_internal_pathname(href);

  if (!pathname || is_known_app_href(manifest, href)) {
    return undefined;
  }

  return {
    href,
    message: `Unknown SvelteKit route href: ${href}`,
  };
}

function add_route_completions(
  completions: Map<string, AutoHrefCompletion>,
  route: RouteRecord,
): void {
  for (const entry of route.entries) {
    add_completion(completions, {
      label: entry,
      insert_text: entry,
      kind: "entry",
      route_id: route.id,
      route_kind: route.route_kind,
    });
  }

  for (const [index, template] of route.templates.entries()) {
    const completion = route.completions[index] ?? template;
    const kind = template.includes("${string}") ? "pattern" : "route";

    add_completion(completions, {
      label: completion,
      insert_text: completion,
      kind,
      route_id: route.id,
      route_kind: route.route_kind,
    });
  }
}

function add_completion(
  completions: Map<string, AutoHrefCompletion>,
  completion: AutoHrefCompletion,
): void {
  completions.set(
    `${completion.kind}:${completion.route_id}:${completion.insert_text}`,
    completion,
  );
}

function route_is_endpoint_only(route: RouteRecord): boolean {
  return route.route_kind === "endpoint";
}

function route_matches_pathname(route: RouteRecord, pathname: string): boolean {
  if (route.entries.includes(pathname)) {
    return true;
  }

  return route.templates.some((template) =>
    template_matches_pathname(route, template, pathname)
  );
}

function template_matches_pathname(
  route: RouteRecord,
  template: string,
  pathname: string,
): boolean {
  const wildcard = route.params.some((param) => param.rest) ? ".*" : "[^/]+";
  const pattern = template
    .split("${string}")
    .map(escape_regex)
    .join(wildcard);

  return new RegExp(`^${pattern}$`).test(pathname);
}

function get_internal_pathname(href: string): string | undefined {
  if (!href.startsWith("/") || href.startsWith("//")) {
    return undefined;
  }

  const hash_index = href.indexOf("#");
  const query_index = href.indexOf("?");
  const end_indexes = [hash_index, query_index].filter((index) => index >= 0);
  const end_index = Math.min(...end_indexes);

  if (!Number.isFinite(end_index)) {
    return href;
  }

  return href.slice(0, end_index);
}

function escape_regex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
