import { expect, test } from "vitest";
import type { AutoHrefManifest } from "../src/manifest";
import { render_html_data } from "../src/html-data-renderer";

test("render_html_data emits native href/action attribute values", () => {
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
		],
	};

	const json = render_html_data(manifest);

	expect(json).toContain('"name": "a"');
	expect(json).toContain('"name": "href"');
	expect(json).toContain('"name": "form"');
	expect(json).toContain('"name": "action"');
	expect(json).toContain("/auth/sign-in");
});

test("render_html_data excludes dynamic pattern insertions", () => {
	const manifest: AutoHrefManifest = {
		version: 1,
		routes_dir: "src/routes",
		routes: [
			{
				id: "/blog/[slug]",
				pathname: "/blog/[slug]",
				route_kind: "page",
				params: [{ name: "slug", optional: false, rest: false }],
				templates: ["/blog/${string}"],
				completions: ["/blog/${slug}"],
				entries: ["/blog/hello-world"],
			},
		],
	};

	const json = render_html_data(manifest);

	expect(json).toContain("/blog/hello-world");
	expect(json).not.toContain("/blog/${slug}");
});
