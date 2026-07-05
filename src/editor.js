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
export function get_href_completions(manifest, options = {}) {
  const include_endpoints = options.include_endpoints ?? true;
  const completions = new Map();
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
export function is_known_app_href(manifest, href) {
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
export function diagnose_href(manifest, href) {
  const pathname = get_internal_pathname(href);
  if (!pathname || is_known_app_href(manifest, href)) {
    return undefined;
  }
  return {
    href,
    message: `Unknown SvelteKit route href: ${href}`,
  };
}
function add_route_completions(completions, route) {
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
function add_completion(completions, completion) {
  completions.set(
    `${completion.kind}:${completion.route_id}:${completion.insert_text}`,
    completion,
  );
}
function route_is_endpoint_only(route) {
  return route.route_kind === "endpoint";
}
function route_matches_pathname(route, pathname) {
  if (route.entries.includes(pathname)) {
    return true;
  }
  return route.templates.some((template) =>
    template_matches_pathname(route, template, pathname)
  );
}
function template_matches_pathname(route, template, pathname) {
  const wildcard = route.params.some((param) => param.rest) ? ".*" : "[^/]+";
  const pattern = template
    .split("${string}")
    .map(escape_regex)
    .join(wildcard);
  return new RegExp(`^${pattern}$`).test(pathname);
}
function get_internal_pathname(href) {
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
function escape_regex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
