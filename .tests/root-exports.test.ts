import { expect, test } from "vitest";
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
} from "../src/mod";

test("root export exposes plugin and public helpers", () => {
	const plugin = href();

	expect(plugin.name).toBe("svelte-auto-href");
	expect(literal_href("/auth/sign-in")).toBe("/auth/sign-in");
	expect(strict_href("/auth/sign-in")).toBe("/auth/sign-in");
	expect(typeof diagnose_href).toBe("function");
	expect(typeof generate_auto_href).toBe("function");
	expect(typeof get_href_completions).toBe("function");
	expect(typeof render_html_data).toBe("function");
	expect(typeof render_types).toBe("function");
	expect(typeof route_segments_from_path).toBe("function");
	expect(typeof scan_routes).toBe("function");
});
