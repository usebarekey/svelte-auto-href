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
export function literal_href(value) {
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
export function strict_href(value) {
  return value;
}
export { href } from "./vite.js";
export {
  diagnose_href,
  get_href_completions,
  is_known_app_href,
} from "./editor.js";
export { generate_auto_href } from "./generator.js";
export { render_types } from "./type-renderer.js";
export { render_html_data } from "./html-data-renderer.js";
export { route_segments_from_path, scan_routes } from "./route-scanner.js";
