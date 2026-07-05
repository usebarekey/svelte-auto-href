# svelte-auto-href

Autocomplete for SvelteKit links.

`svelte-auto-href` gives your editor route suggestions in the places where you
write URLs: links, form actions, `goto(...)`, `redirect(...)`, and similar
calls. Add the Vite plugin, and it keeps a small generated snapshot of your
routes in `.svelte-kit` as your app changes.

It is intentionally flexible. You get suggestions for app routes like
`/auth/sign-in`, but external URLs, anchors, CMS paths, and generated slugs
still work like normal strings.

## Install

```sh
npm install -D svelte-auto-href
```

## Setup

Add the Vite plugin to `vite.config.ts`:

```ts
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { href } from "svelte-auto-href";

export default defineConfig({
  plugins: [href(), sveltekit()],
});
```

The plugin is also available from its area export:

```ts
import { href } from "svelte-auto-href/vite";
```

By default the plugin writes:

- `.svelte-kit/svelte-auto-href/manifest.json`
- `.svelte-kit/svelte-auto-href/html-data.json`
- `.svelte-kit/types/svelte-auto-href/$types.d.ts`

The declaration file lives under `.svelte-kit/types`, so SvelteKit projects that
extend `./.svelte-kit/tsconfig.json` can pick it up through the usual generated
type include.

```json
{
  "extends": "./.svelte-kit/tsconfig.json"
}
```

## What Gets Typed

The generated declaration file augments:

- `svelte-auto-href/generated` with generated route types
- `svelte-auto-href` with `literal_href(...)` and `strict_href(...)` overloads
- `$app/navigation` for `goto`, `invalidate`, `preloadData`, `preloadCode`,
  `pushState`, and `replaceState`
- `@sveltejs/kit` for `redirect`

It imports SvelteKit's generated route source:

```ts
import type { PathnameWithSearchOrHash } from "$app/types";
```

Then it layers statically discovered `entries()` values on top:

```ts
type LooseString = string & {};
type GeneratedStrictAppHref = PathnameWithSearchOrHash | ConcreteEntryHref;
type GeneratedAutoHref = GeneratedStrictAppHref | LooseString;
```

SvelteKit remains the canonical source for route IDs, params, matchers, and
pathname patterns. `svelte-auto-href` adds manifest data, editor completions,
HTML custom data, and concrete literal suggestions for `entries()` values that
can be read without executing application code.

## Dynamic Routes And Entries

Dynamic routes are represented as patterns:

```txt
src/routes/blog/[slug]/+page.svelte -> /blog/${slug}
```

If a route exports literal `entries()`, those concrete paths are added as
specific suggestions:

```ts
export const entries = () => [
  { slug: "hello-world" },
  { slug: "release-notes" },
];
```

That route can suggest:

```txt
/blog/${slug}
/blog/hello-world
/blog/release-notes
```

Generated slugs still type-check because the loose href type intentionally keeps
`string & {}` in the union.

## Imports

Everything public is available from the package root:

```ts
import {
  diagnose_href,
  generate_auto_href,
  get_href_completions,
  href,
  literal_href,
  render_html_data,
  scan_routes,
  strict_href,
} from "svelte-auto-href";
```

Area exports are available when integrations want a smaller surface:

```ts
import { href } from "svelte-auto-href/vite";
import { diagnose_href, get_href_completions } from "svelte-auto-href/editor";
import { generate_auto_href } from "svelte-auto-href/generator";
import { scan_routes } from "svelte-auto-href/scanner";
```

Most apps only need `href()` in `vite.config.ts`. `literal_href()` is an
identity helper for TypeScript call sites where an explicit function reads
better than a local cast.

## Editor Integrations

The `svelte-auto-href/editor` export provides manifest-backed helpers for
language servers and editor plugins:

```ts
import { diagnose_href, get_href_completions } from "svelte-auto-href/editor";

const completions = get_href_completions(manifest);
const diagnostic = diagnose_href(manifest, "/auth/sing-in");
```

Diagnostics ignore non-internal strings such as `https://`, `mailto:`, hash-only
links, and protocol-relative URLs.

The generated `.svelte-kit/svelte-auto-href/html-data.json` follows the VS Code
HTML custom-data format used by Svelte tooling. Point an editor's Svelte HTML
custom data setting at that file to get native attribute completions for:

- `<a href>`
- `<area href>`
- `<form action>`
- `<button formaction>`
- `<input formaction>`

## Options

```ts
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { href } from "svelte-auto-href";

export default defineConfig({
  plugins: [
    href({
      routes_dir: "src/routes",
      output_dir: ".svelte-kit/svelte-auto-href",
      types_path: ".svelte-kit/types/svelte-auto-href/$types.d.ts",
    }),
    sveltekit(),
  ],
});
```

| Option       | Default                                          | Description                                           |
| ------------ | ------------------------------------------------ | ----------------------------------------------------- |
| `routes_dir` | `src/routes`                                     | SvelteKit route directory, relative to the Vite root. |
| `output_dir` | `.svelte-kit/svelte-auto-href`                   | Directory for `manifest.json` and `html-data.json`.   |
| `types_path` | `.svelte-kit/types/svelte-auto-href/$types.d.ts` | Generated declaration file path.                      |
