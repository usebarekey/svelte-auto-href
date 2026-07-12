import { expect, test } from "vitest";
import { render_types } from "../src/type-renderer";
import type { AutoHrefManifest } from "../src/manifest";

test("render_types preserves autocomplete literals while allowing loose strings", () => {
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

	const code = render_types(manifest);

	expect(code).toContain('import type { PathnameWithSearchOrHash } from "$app/types";');
	expect(code).toContain("type LooseString = string & {};");
	expect(code).toContain("type GeneratedAutoHref = GeneratedStrictAppHref | LooseString;");
	expect(code).toContain('type ConcreteEntryPathname = "/blog/hello-world";');
	expect(code).toContain('declare module "$app/navigation"');
	expect(code).toContain('declare module "@sveltejs/kit"');
	expect(code).toContain('declare module "svelte-auto-href/generated"');
	expect(code).toContain("interface GeneratedHrefTypes {");
	expect(code).toContain("auto_href: GeneratedAutoHref;");
	expect(code).toContain("strict_app_href: GeneratedStrictAppHref;");
	expect(code).not.toContain("export function strict_href<T extends GeneratedStrictAppHref>");
	expect(code).not.toContain("export function href<T extends GeneratedAutoHref>");
});
