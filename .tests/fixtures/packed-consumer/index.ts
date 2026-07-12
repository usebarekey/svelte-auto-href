import { strict_href } from "svelte-auto-href";

strict_href("/known");

/** @ts-expect-error Unknown app routes must be rejected by generated types. */
strict_href("/unknown");
