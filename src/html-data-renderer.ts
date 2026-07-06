import type { AutoHrefManifest } from "./manifest.ts";
import { type AutoHrefCompletion, get_href_completions } from "./editor.ts";

interface HtmlDataAttribute {
	name: string;
	values: { name: string }[];
}

interface HtmlDataTag {
	name: string;
	attributes: HtmlDataAttribute[];
}

interface HtmlCustomData {
	version: 1.1;
	tags: HtmlDataTag[];
}

/**
 * Renders VS Code/Svelte language-server compatible HTML custom data for
 * native route-like attributes.
 *
 * @example
 * ```ts
 * const json = render_html_data(manifest);
 * ```
 *
 * @since 0.1.0
 * @param manifest - Generated route manifest.
 * @returns Formatted HTML custom-data JSON.
 */
export function render_html_data(manifest: AutoHrefManifest): string {
	const completions = get_href_completions(manifest);
	const values = completions
		.filter(is_markup_completion)
		.map((completion) => ({ name: completion.insert_text }))
		.sort((left, right) => left.name.localeCompare(right.name));

	const data: HtmlCustomData = {
		version: 1.1,
		tags: [
			make_tag("a", "href", values),
			make_tag("area", "href", values),
			make_tag("form", "action", values),
			make_tag("button", "formaction", values),
			make_tag("input", "formaction", values),
		],
	};

	return `${JSON.stringify(data, null, 2)}\n`;
}

function make_tag(name: string, attribute: string, values: { name: string }[]): HtmlDataTag {
	return {
		name,
		attributes: [
			{
				name: attribute,
				values,
			},
		],
	};
}

function is_markup_completion(completion: AutoHrefCompletion): boolean {
	return completion.insert_text.startsWith("/") && !completion.insert_text.includes("${string}");
}
