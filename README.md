<h1 align="center">svelte-auto-href</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/svelte-auto-href">npm</a>
  •
  <a href="https://docs.barekey.dev/auto-href">docs</a>
</p>

---

Get route-aware suggestions wherever you write a SvelteKit URL.

```svelte
<script lang="ts">
  import { goto } from "$app/navigation";
  import { strict_href } from "svelte-auto-href";

  const settings_href = strict_href("/account/settings");
</script>

<nav>
  <a href="/account/profile">Profile</a>
  <button onclick={() => goto(settings_href)}>Settings</button>
</nav>
```

`svelte-auto-href` turns your SvelteKit route tree into suggestions for markup, navigation helpers, redirects, and explicit href values. Loose href surfaces still accept dynamic and external strings, while `strict_href()` rejects unknown app routes when you want an enforced boundary.

Visit the **[docs](https://docs.barekey.dev/auto-href)** for installation, editor setup, route typing, configuration, and API reference.
