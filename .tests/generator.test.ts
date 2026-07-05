import { assert, assertStringIncludes } from "@std/assert";
import { join } from "node:path";
import { generate_auto_href } from "../src/generator.ts";

Deno.test("generate_auto_href writes manifest and declaration files", async () => {
  const root = await Deno.makeTempDir();
  const routes_dir = join(root, "src", "routes");

  await Deno.mkdir(join(routes_dir, "auth", "sign-in"), { recursive: true });
  await Deno.writeTextFile(
    join(routes_dir, "auth", "sign-in", "+page.svelte"),
    "",
  );

  const result = await generate_auto_href({ root });
  const manifest_text = await Deno.readTextFile(result.manifest_path);
  const types_text = await Deno.readTextFile(result.types_path);
  const html_data_text = await Deno.readTextFile(result.html_data_path);

  assert(result.manifest.routes.some((route) => route.id === "/auth/sign-in"));
  assertStringIncludes(manifest_text, "/auth/sign-in");
  assertStringIncludes(types_text, "GeneratedAutoHref");
  assertStringIncludes(html_data_text, '"href"');
  assertStringIncludes(html_data_text, "/auth/sign-in");
});
