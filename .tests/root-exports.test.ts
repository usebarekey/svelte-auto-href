import { assertEquals } from "@std/assert";
import {
  diagnose_href,
  generate_auto_href,
  get_href_completions,
  href,
  literal_href,
  render_html_data,
  render_types,
  route_segments_from_path,
  scan_routes,
  strict_href,
} from "../src/mod.ts";

Deno.test("root export exposes plugin and public helpers", () => {
  const plugin = href();

  assertEquals(plugin.name, "svelte-auto-href");
  assertEquals(literal_href("/auth/sign-in"), "/auth/sign-in");
  assertEquals(strict_href("/auth/sign-in"), "/auth/sign-in");
  assertEquals(typeof diagnose_href, "function");
  assertEquals(typeof generate_auto_href, "function");
  assertEquals(typeof get_href_completions, "function");
  assertEquals(typeof render_html_data, "function");
  assertEquals(typeof render_types, "function");
  assertEquals(typeof route_segments_from_path, "function");
  assertEquals(typeof scan_routes, "function");
});
