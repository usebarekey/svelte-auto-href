import { assertStringIncludes } from "@std/assert";
import { render_html_data } from "../src/html-data-renderer.ts";
import type { AutoHrefManifest } from "../src/manifest.ts";

Deno.test("render_html_data emits native href/action attribute values", () => {
  const manifest: AutoHrefManifest = {
    version: 1,
    routes_dir: "src/routes",
    routes: [{
      id: "/auth/sign-in",
      pathname: "/auth/sign-in",
      route_kind: "page",
      params: [],
      templates: ["/auth/sign-in"],
      completions: ["/auth/sign-in"],
      entries: [],
    }],
  };

  const json = render_html_data(manifest);

  assertStringIncludes(json, '"name": "a"');
  assertStringIncludes(json, '"name": "href"');
  assertStringIncludes(json, '"name": "form"');
  assertStringIncludes(json, '"name": "action"');
  assertStringIncludes(json, "/auth/sign-in");
});
