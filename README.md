<h1 align="center">svelte-auto-href</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/svelte-auto-href">npm</a>
  •
  <a href="https://barekey.dev/docs/auto-href">docs</a>
</p>

---

Write SvelteKit links with autocomplete everywhere. Seriously!

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

Routes from your SvelteKit app become editor suggestions in markup, navigation helpers, redirects, and explicit href values. Dynamic URLs and external links remain ordinary strings when you need them.

Visit the **[docs](https://barekey.dev/docs/auto-href)** for installation, editor setup, route typing, configuration, and API reference.
