import { resolve } from "node:path";
import { generate_auto_href } from "./generator.ts";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";

/**
 * Options for the `svelte-auto-href` Vite plugin.
 *
 * @example
 * ```ts
 * auto_href({
 *   routes_dir: "src/routes",
 * });
 * ```
 *
 * @since 0.1.0
 */
export interface AutoHrefOptions {
  /** Route directory relative to the Vite root. Defaults to `src/routes`. */
  routes_dir?: string;

  /** Generated output directory relative to the Vite root. Defaults to `.svelte-auto-href`. */
  output_dir?: string;
}

/**
 * Vite plugin that generates route autocomplete metadata for SvelteKit apps.
 *
 * @example
 * ```ts
 * import { sveltekit } from "@sveltejs/kit/vite";
 * import { defineConfig } from "vite";
 * import { auto_href } from "svelte-auto-href/vite";
 *
 * export default defineConfig({
 *   plugins: [auto_href(), sveltekit()],
 * });
 * ```
 *
 * @since 0.1.0
 * @param options - Optional route and output directory settings.
 * @returns A Vite plugin.
 */
export function auto_href(options: AutoHrefOptions = {}): Plugin {
  let resolved_config: ResolvedConfig | undefined;

  const generate = async () => {
    if (!resolved_config) {
      return;
    }

    await generate_auto_href({
      root: resolved_config.root,
      routes_dir: options.routes_dir,
      output_dir: options.output_dir,
    });
  };

  return {
    name: "svelte-auto-href",

    configResolved(config) {
      resolved_config = config;
    },

    async buildStart() {
      await generate();
    },

    configureServer(server) {
      configure_route_watcher(server, options, generate);
    },
  };
}

function configure_route_watcher(
  server: ViteDevServer,
  options: AutoHrefOptions,
  generate: () => Promise<void>,
): void {
  const routes_dir = resolve(
    server.config.root,
    options.routes_dir ?? "src/routes",
  );

  const regenerate = (file: string) => {
    if (!is_route_tree_file(routes_dir, file)) {
      return;
    }

    void generate();
  };

  void generate();

  server.watcher.add(routes_dir);
  server.watcher.on("add", regenerate);
  server.watcher.on("change", regenerate);
  server.watcher.on("unlink", regenerate);
  server.watcher.on("addDir", regenerate);
  server.watcher.on("unlinkDir", regenerate);
}

function is_route_tree_file(routes_dir: string, file: string): boolean {
  const normalized_routes_dir = normalize_path(routes_dir);
  const normalized_file = normalize_path(file);

  return normalized_file === normalized_routes_dir ||
    normalized_file.startsWith(`${normalized_routes_dir}/`);
}

function normalize_path(value: string): string {
  return value.replace(/\\/g, "/");
}
