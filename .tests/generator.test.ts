import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { generate_auto_href } from "../src/generator";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

test("generate_auto_href writes manifest and declaration files", async () => {
	const root = await mkdtemp(join(tmpdir(), "svelte-auto-href-"));
	const routes_dir = join(root, "src", "routes");

	try {
		await mkdir(join(routes_dir, "auth", "sign-in"), { recursive: true });
		await writeFile(join(routes_dir, "auth", "sign-in", "+page.svelte"), "");

		const result = await generate_auto_href({ root });
		const manifest_text = await readFile(result.manifest_path, "utf8");
		const types_text = await readFile(result.types_path, "utf8");
		const html_data_text = await readFile(result.html_data_path, "utf8");

		expect(result.manifest.routes.some((route) => route.id === "/auth/sign-in")).toBe(true);
		expect(result.manifest_path).toBe(
			join(root, ".svelte-kit", "svelte-auto-href", "manifest.json"),
		);
		expect(result.types_path).toBe(
			join(root, ".svelte-kit", "types", "svelte-auto-href", "$types.d.ts"),
		);
		expect(manifest_text).toContain("/auth/sign-in");
		expect(types_text).toContain("GeneratedAutoHref");
		expect(html_data_text).toContain('"href"');
		expect(html_data_text).toContain("/auth/sign-in");
	} finally {
		await rm(root, { force: true, recursive: true });
	}
});
