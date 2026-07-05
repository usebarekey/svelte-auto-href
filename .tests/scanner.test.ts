import { assert, assertEquals } from "@std/assert";
import { join } from "node:path";
import { scan_routes } from "../src/route-scanner.ts";

Deno.test("scan_routes discovers SvelteKit pages, endpoints, params, groups, and entries", async () => {
  const root = await Deno.makeTempDir();
  const routes_dir = join(root, "src", "routes");

  await write_route_file(routes_dir, "+page.svelte", "");
  await write_route_file(join(routes_dir, "about"), "+page.svelte", "");
  await write_route_file(
    join(routes_dir, "(app)", "auth", "sign-in"),
    "+page.svelte",
    "",
  );
  await write_route_file(
    join(routes_dir, "blog", "[slug]"),
    "+page.svelte",
    "",
  );
  await write_route_file(
    join(routes_dir, "blog", "[slug]"),
    "+page.ts",
    [
      "export const entries = () => [",
      '  { slug: "hello-world" },',
      '  { slug: "second-post" },',
      "] as const;",
    ].join("\n"),
  );
  await write_route_file(
    join(routes_dir, "docs", "[[lang]]", "guide"),
    "+page.svelte",
    "",
  );
  await write_route_file(
    join(routes_dir, "files", "[...path]"),
    "+server.ts",
    'export const trailingSlash = "ignore";',
  );
  await write_route_file(
    join(routes_dir, "fruits", "[page=fruit]"),
    "+page.svelte",
    "",
  );
  await write_route_file(
    join(routes_dir, "sv-dashboard"),
    "+page.sv",
    "",
  );

  const manifest = await scan_routes({ routes_dir });
  const auth_route = manifest.routes.find((route) =>
    route.id === "/(app)/auth/sign-in"
  );
  const blog_route = manifest.routes.find((route) =>
    route.id === "/blog/[slug]"
  );
  const docs_route = manifest.routes.find((route) =>
    route.id === "/docs/[[lang]]/guide"
  );
  const files_route = manifest.routes.find((route) =>
    route.id === "/files/[...path]"
  );
  const fruit_route = manifest.routes.find((route) =>
    route.id === "/fruits/[page=fruit]"
  );
  const sv_route = manifest.routes.find((route) =>
    route.id === "/sv-dashboard"
  );

  assert(auth_route);
  assert(blog_route);
  assert(docs_route);
  assert(files_route);
  assert(fruit_route);
  assert(sv_route);

  assertEquals(auth_route.completions, ["/auth/sign-in"]);
  assertEquals(blog_route.templates, ["/blog/${string}"]);
  assertEquals(blog_route.completions, ["/blog/${slug}"]);
  assertEquals(blog_route.entries, ["/blog/hello-world", "/blog/second-post"]);
  assertEquals(docs_route.templates, ["/docs/guide", "/docs/${string}/guide"]);
  assertEquals(files_route.templates, [
    "/files/${string}",
    "/files/${string}/",
  ]);
  assertEquals(files_route.route_kind, "endpoint");
  assertEquals(fruit_route.params[0]?.matcher, "fruit");
  assertEquals(sv_route.completions, ["/sv-dashboard"]);
});

async function write_route_file(
  dir: string,
  file: string,
  content: string,
): Promise<void> {
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(join(dir, file), content);
}
