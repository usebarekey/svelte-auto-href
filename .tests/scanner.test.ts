import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import type { RouteRecord } from "../src/manifest";
import { scan_routes } from "../src/route-scanner";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";

test("scan_routes discovers SvelteKit pages, endpoints, params, groups, and entries", async () => {
	const root = await mkdtemp(join(tmpdir(), "svelte-auto-href-routes-"));
	const routes_dir = join(root, "src", "routes");

	try {
		await write_route_file(routes_dir, "+page.svelte", "");
		await write_route_file(join(routes_dir, "about"), "+page.svelte", "");
		await write_route_file(join(routes_dir, "(app)", "auth", "sign-in"), "+page.svelte", "");
		await write_route_file(join(routes_dir, "blog", "[slug]"), "+page.svelte", "");
		await write_route_file(
			join(routes_dir, "blog", "[slug]"),
			"+page.ts",
			[
				"export const entries = () => [",
				'  { slug: "hello-world" },',
				'  { slug: "second-post" },',
				"] as const;",
			].join("\n"),
		);
		await write_route_file(join(routes_dir, "docs", "[[lang]]", "guide"), "+page.svelte", "");
		await write_route_file(
			join(routes_dir, "files", "[...path]"),
			"+server.ts",
			'export const trailingSlash = "ignore";',
		);
		await write_route_file(
			join(routes_dir, "quoted-config"),
			"+page.ts",
			"const sample = \"export const trailingSlash = 'always';\";",
		);
		await write_route_file(join(routes_dir, "fruits", "[page=fruit]"), "+page.svelte", "");
		await write_route_file(join(routes_dir, "sv-dashboard"), "+page.sv", "");

		const manifest = await scan_routes({ routes_dir });
		const auth_route = find_route(manifest.routes, "/(app)/auth/sign-in");
		const blog_route = find_route(manifest.routes, "/blog/[slug]");
		const docs_route = find_route(manifest.routes, "/docs/[[lang]]/guide");
		const files_route = find_route(manifest.routes, "/files/[...path]");
		const fruit_route = find_route(manifest.routes, "/fruits/[page=fruit]");
		const quoted_config_route = find_route(manifest.routes, "/quoted-config");
		const sv_route = find_route(manifest.routes, "/sv-dashboard");

		expect(auth_route.completions).toEqual(["/auth/sign-in"]);
		expect(blog_route.templates).toEqual(["/blog/${string}"]);
		expect(blog_route.completions).toEqual(["/blog/${slug}"]);
		expect(blog_route.entries).toEqual(["/blog/hello-world", "/blog/second-post"]);
		expect(docs_route.templates).toEqual(["/docs/guide", "/docs/${string}/guide"]);
		expect(files_route.templates).toEqual(["/files/${string}", "/files/${string}/"]);
		expect(files_route.route_kind).toBe("endpoint");
		expect(fruit_route.params[0]?.matcher).toBe("fruit");
		expect(quoted_config_route.templates).toEqual(["/quoted-config"]);
		expect(sv_route.completions).toEqual(["/sv-dashboard"]);
	} finally {
		await rm(root, { force: true, recursive: true });
	}
});

async function write_route_file(dir: string, file: string, content: string): Promise<void> {
	await mkdir(dir, { recursive: true });
	await writeFile(join(dir, file), content);
}

function find_route(routes: readonly RouteRecord[], id: string): RouteRecord {
	const route = routes.find((item) => item.id === id);

	if (!route) {
		throw new Error(`Expected route ${id} to be discovered.`);
	}

	return route;
}
