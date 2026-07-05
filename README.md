# svelte-auto-href

Autocomplete-friendly href metadata for SvelteKit.

`svelte-auto-href` generates a route manifest and TypeScript declarations from
your SvelteKit route tree. The generated type shape uses the editor trick:

```ts
type AutoHref = KnownHref | (string & {});
```

That keeps known app routes visible in IntelliSense while still allowing
external URLs, CMS slugs, hash links, and other generated strings.

## Setup

```ts
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { auto_href } from "svelte-auto-href/vite";

export default defineConfig({
  plugins: [auto_href(), sveltekit()],
});
```

The plugin writes:

- `.svelte-kit/svelte-auto-href/manifest.json`
- `.svelte-kit/types/svelte-auto-href/$types.d.ts`
- `.svelte-kit/svelte-auto-href/html-data.json`

Include the generated declarations in your app `tsconfig.json` if your editor
does not pick them up automatically. By default the declaration file is placed
under `.svelte-kit/types/**/$types.d.ts`, matching SvelteKit's generated type
include pattern:

```json
{
  "extends": "./.svelte-kit/tsconfig.json"
}
```

## Generated Types

The generated declaration file imports SvelteKit's strict route source:

```ts
import type { PathnameWithSearchOrHash } from "$app/types";
```

Then it layers route completions over arbitrary strings:

```ts
type LooseString = string & {};
type GeneratedStrictAppHref = PathnameWithSearchOrHash | ConcreteEntryHref;
type GeneratedAutoHref = GeneratedStrictAppHref | LooseString;
```

SvelteKit remains the canonical source for route IDs, params, matchers, and
pathname patterns. `svelte-auto-href` adds concrete literal `entries()` values
when they can be statically extracted without executing user code.

## Runtime Helpers

The runtime helpers are identity functions. Their generated overloads give
editors better call-site hints.

```ts
import { href, strict_href } from "svelte-auto-href";

const loose = href("/auth/sign-in");
const strict = strict_href("/blog/hello-world");
```

## Editor Integrations

The `svelte-auto-href/editor` export provides manifest-backed helpers for
language servers or editor plugins:

```ts
import { diagnose_href, get_href_completions } from "svelte-auto-href/editor";

const completions = get_href_completions(manifest);
const diagnostic = diagnose_href(manifest, "/auth/sing-in");
```

It intentionally ignores non-internal strings such as `https://`, `mailto:`,
hash-only links, and protocol-relative URLs.

The generated `.svelte-kit/svelte-auto-href/html-data.json` follows the VS Code
HTML custom-data shape used by Svelte tooling. Point your editor's Svelte HTML
custom data setting at it to get native attribute completions for:

- `<a href>`
- `<area href>`
- `<form action>`
- `<button formaction>`
- `<input formaction>`
