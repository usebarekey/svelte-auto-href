import { strict_href } from "../src/mod";

declare module "../src/mod" {
	interface GeneratedHrefTypes {
		auto_href: "/known" | (string & Record<never, never>);
		strict_app_href: "/auth/sign-in" | "/known";
	}
}

strict_href("/known");

/** @ts-expect-error Unknown app routes must be rejected by generated types. */
strict_href("/unknown");
