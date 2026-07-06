import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import {
	init_auto_href,
	parse_auto_href_cli_args,
	patch_auto_href_vscode_settings,
	resolve_vscode_settings_path,
} from "../src/init";

test("patch_auto_href_vscode_settings creates html custom data", () => {
	const result = patch_auto_href_vscode_settings("{}\n");

	expect(result.changed).toBe(true);
	expect(result.text).toContain('".svelte-kit/svelte-auto-href/html-data.json"');
});

test("patch_auto_href_vscode_settings preserves and dedupes existing custom data", () => {
	const result = patch_auto_href_vscode_settings(`{
    // keep this comment
    "html.customData": [
      "vendor/html-data.json",
      ".svelte-kit/svelte-auto-href/html-data.json"
    ]
  }
`);

	expect(result.changed).toBe(false);
	expect(result.text).toContain("// keep this comment");
});

test("init_auto_href writes local VS Code settings", async () => {
	const root = await mkdtemp(join(tmpdir(), "svelte-auto-href-init-"));

	try {
		const result = await init_auto_href({ cwd: root });
		const settings_path = join(root, ".vscode", "settings.json");
		const settings_text = await readFile(settings_path, "utf8");

		expect(result.settings_path).toBe(settings_path);
		expect(result.scope).toBe("local");
		expect(result.changed).toBe(true);
		expect(settings_text).toContain('".svelte-kit/svelte-auto-href/html-data.json"');
	} finally {
		await rm(root, { force: true, recursive: true });
	}
});

test("resolve_vscode_settings_path supports Windows VS Code-family editors", () => {
	const path = resolve_vscode_settings_path({
		editor: "cursor",
		platform: "win32",
		env: { APPDATA: "C:\\Users\\Sander\\AppData\\Roaming" },
		home_dir: "C:\\Users\\Sander",
	});

	expect(path).toBe("C:\\Users\\Sander\\AppData\\Roaming\\Cursor\\User\\settings.json");
});

test("resolve_vscode_settings_path supports macOS VS Code-family editors", () => {
	const path = resolve_vscode_settings_path({
		editor: "vscodium",
		platform: "darwin",
		home_dir: "/Users/sander",
	});

	expect(path).toBe("/Users/sander/Library/Application Support/VSCodium/User/settings.json");
});

test("resolve_vscode_settings_path supports Linux VS Code-family editors", () => {
	const path = resolve_vscode_settings_path({
		editor: "windsurf",
		platform: "linux",
		env: { XDG_CONFIG_HOME: "/home/sander/.config/custom" },
		home_dir: "/home/sander",
	});

	expect(path).toBe("/home/sander/.config/custom/Windsurf/User/settings.json");
});

test("parse_auto_href_cli_args parses init flags", () => {
	const options = parse_auto_href_cli_args([
		"init",
		"--global",
		"--editor",
		"cursor",
		"--cwd",
		"fixture",
	]);

	expect(options).toEqual({
		global: true,
		editor: "cursor",
		cwd: "fixture",
	});
});
