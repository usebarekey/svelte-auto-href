import { expect, test } from "vitest";
import type { AutoHrefManifest } from "../src/manifest";
import { diagnose_href, get_href_completions, is_known_app_href } from "../src/editor";

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

test("get_href_completions returns routes, entries, and dynamic patterns", () => {
	const completions = get_href_completions(manifest);
	const labels = completions.map((completion) => completion.label);

	expect(labels).toContain("/auth/sign-in");
	expect(labels).toContain("/blog/${slug}");
	expect(labels).toContain("/blog/hello-world");
	expect(labels).toContain("/api/session");
});

test("get_href_completions can hide endpoint-only routes", () => {
	const completions = get_href_completions(manifest, {
		include_endpoints: false,
	});
	const labels = completions.map((completion) => completion.label);

	expect(labels).not.toContain("/api/session");
});

test("is_known_app_href accepts entries, query strings, and dynamic patterns", () => {
	expect(is_known_app_href(manifest, "/auth/sign-in")).toBe(true);
	expect(is_known_app_href(manifest, "/blog/hello-world?preview=true")).toBe(true);
	expect(is_known_app_href(manifest, "/blog/generated-slug")).toBe(true);
});

test("diagnose_href ignores non-internal strings and warns on internal typos", () => {
	expect(diagnose_href(manifest, "https://example.com")).toBeUndefined();
	expect(diagnose_href(manifest, "mailto:sander@example.com")).toBeUndefined();
	expect(diagnose_href(manifest, "#content")).toBeUndefined();

	const diagnostic = diagnose_href(manifest, "/auth/sing-in");

	expect(diagnostic?.message).toBe("Unknown SvelteKit route href: /auth/sing-in");
});
