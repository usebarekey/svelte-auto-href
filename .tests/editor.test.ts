import { assert, assertEquals } from "@std/assert";
import {
  diagnose_href,
  get_href_completions,
  is_known_app_href,
} from "../src/editor.ts";
import type { AutoHrefManifest } from "../src/manifest.ts";

const manifest: AutoHrefManifest = {
  version: 1,
  routes_dir: "src/routes",
  routes: [
    {
      id: "/auth/sign-in",
      pathname: "/auth/sign-in",
      route_kind: "page",
      params: [],
      templates: ["/auth/sign-in"],
      completions: ["/auth/sign-in"],
      entries: [],
    },
    {
      id: "/blog/[slug]",
      pathname: "/blog/[slug]",
      route_kind: "page",
      params: [{ name: "slug", optional: false, rest: false }],
      templates: ["/blog/${string}"],
      completions: ["/blog/${slug}"],
      entries: ["/blog/hello-world"],
    },
    {
      id: "/api/session",
      pathname: "/api/session",
      route_kind: "endpoint",
      params: [],
      templates: ["/api/session"],
      completions: ["/api/session"],
      entries: [],
    },
  ],
};

Deno.test("get_href_completions returns routes, entries, and dynamic patterns", () => {
  const completions = get_href_completions(manifest);
  const labels = completions.map((completion) => completion.label);

  assert(labels.includes("/auth/sign-in"));
  assert(labels.includes("/blog/${slug}"));
  assert(labels.includes("/blog/hello-world"));
  assert(labels.includes("/api/session"));
});

Deno.test("get_href_completions can hide endpoint-only routes", () => {
  const completions = get_href_completions(manifest, {
    include_endpoints: false,
  });
  const labels = completions.map((completion) => completion.label);

  assert(!labels.includes("/api/session"));
});

Deno.test("is_known_app_href accepts entries, query strings, and dynamic patterns", () => {
  assert(is_known_app_href(manifest, "/auth/sign-in"));
  assert(is_known_app_href(manifest, "/blog/hello-world?preview=true"));
  assert(is_known_app_href(manifest, "/blog/generated-slug"));
});

Deno.test("diagnose_href ignores non-internal strings and warns on internal typos", () => {
  assertEquals(diagnose_href(manifest, "https://example.com"), undefined);
  assertEquals(diagnose_href(manifest, "mailto:sander@example.com"), undefined);
  assertEquals(diagnose_href(manifest, "#content"), undefined);

  const diagnostic = diagnose_href(manifest, "/auth/sing-in");

  assertEquals(
    diagnostic?.message,
    "Unknown SvelteKit route href: /auth/sing-in",
  );
});
