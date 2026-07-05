import { assertFalse, assertStringIncludes } from "@std/assert";
import { render_types } from "../src/type-renderer.ts";
import type { AutoHrefManifest } from "../src/manifest.ts";

Deno.test("render_types preserves autocomplete literals while allowing loose strings", () => {
  const manifest: AutoHrefManifest = {
    version: 1,
    routes_dir: "src/routes",
    routes: [{
      id: "/blog/[slug]",
      pathname: "/blog/[slug]",
      route_kind: "page",
      params: [{ name: "slug", optional: false, rest: false }],
      templates: ["/blog/${string}"],
      completions: ["/blog/${slug}"],
      entries: ["/blog/hello-world"],
    }],
  };

  const code = render_types(manifest);

  assertStringIncludes(
    code,
    'import type { PathnameWithSearchOrHash } from "$app/types";',
  );
  assertStringIncludes(code, "type LooseString = string & {};");
  assertStringIncludes(
    code,
    "type GeneratedAutoHref = GeneratedStrictAppHref | LooseString;",
  );
  assertStringIncludes(
    code,
    'type ConcreteEntryPathname = "/blog/hello-world";',
  );
  assertStringIncludes(code, 'declare module "$app/navigation"');
  assertStringIncludes(code, 'declare module "@sveltejs/kit"');
  assertStringIncludes(code, 'declare module "svelte-auto-href/generated"');
  assertStringIncludes(
    code,
    "export function literal_href<T extends GeneratedAutoHref>(value: T): T;",
  );
  assertFalse(
    code.includes("export function href<T extends GeneratedAutoHref>"),
  );
});
