import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { render_html_data } from "./html-data-renderer.js";
import { scan_routes } from "./route-scanner.js";
import { render_types } from "./type-renderer.js";
/**
 * Generates SvelteKit-owned output under `.svelte-kit` for a project.
 *
 * @example
 * ```ts
 * await generate_auto_href({
 *   root: process.cwd(),
 * });
 * ```
 *
 * @since 0.1.0
 * @param options - Generation options.
 * @returns Generated manifest and output paths.
 */
export async function generate_auto_href(options) {
  const routes_dir = resolve_project_path(
    options.root,
    options.routes_dir ?? "src/routes",
  );
  const output_dir = resolve_project_path(
    options.root,
    options.output_dir ?? ".svelte-kit/svelte-auto-href",
  );
  const manifest_path = join(output_dir, "manifest.json");
  const html_data_path = join(output_dir, "html-data.json");
  const types_path = resolve_project_path(
    options.root,
    options.types_path ?? ".svelte-kit/types/svelte-auto-href/$types.d.ts",
  );
  const routes_exist = await path_exists(routes_dir);
  const manifest = routes_exist
    ? await scan_routes({ routes_dir })
    : make_empty_manifest(routes_dir);
  await mkdir(output_dir, { recursive: true });
  await mkdir(dirname(types_path), { recursive: true });
  await write_if_changed(
    manifest_path,
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await write_if_changed(types_path, render_types(manifest));
  await write_if_changed(html_data_path, render_html_data(manifest));
  return {
    manifest,
    manifest_path,
    types_path,
    html_data_path,
  };
}
function resolve_project_path(root, value) {
  if (
    /^[A-Za-z]:[\\/]/.test(value) || value.startsWith("/") ||
    value.startsWith("\\")
  ) {
    return resolve(value);
  }
  return resolve(root, value);
}
function make_empty_manifest(routes_dir) {
  return {
    version: 1,
    routes_dir,
    routes: [],
  };
}
async function path_exists(pathname) {
  return await stat(pathname).then(() => true, () => false);
}
async function write_if_changed(pathname, content) {
  const current = await readFile(pathname, "utf8").then(
    (value) => value,
    () => undefined,
  );
  if (current === content) {
    return;
  }
  await writeFile(pathname, content);
}
