import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import ts from "typescript";
import type {
  AutoHrefManifest,
  RouteKind,
  RouteParam,
  RouteRecord,
} from "./manifest.ts";

/**
 * Options for scanning a SvelteKit route directory.
 *
 * @example
 * ```ts
 * const options: ScanRoutesOptions = {
 *   routes_dir: "src/routes",
 * };
 * ```
 *
 * @since 0.1.0
 */
export interface ScanRoutesOptions {
  /** Directory containing SvelteKit route folders. */
  routes_dir: string;
}

interface RouteDirectory {
  dir: string;
  segments: string[];
  files: string[];
  route_kind: RouteKind;
}

interface SegmentToken {
  raw: string;
  name: string;
  matcher: string | undefined;
  optional: boolean;
  rest: boolean;
  start: number;
  end: number;
}

interface PathVariant {
  pathname_segments: string[];
  template_segments: string[];
  completion_segments: string[];
}

interface ParsedRoute {
  id: string;
  pathname: string;
  params: RouteParam[];
  templates: string[];
  completions: string[];
}

type EntryParams = Record<string, string>;

/**
 * Scans a SvelteKit route tree and builds the manifest consumed by generated
 * types and editor integrations.
 *
 * @example
 * ```ts
 * const manifest = await scan_routes({
 *   routes_dir: "src/routes",
 * });
 * ```
 *
 * @since 0.1.0
 * @param options - Route scanning options.
 * @returns A manifest describing pages, endpoints, params, completions, and
 *   statically extracted entries.
 */
export async function scan_routes(
  options: ScanRoutesOptions,
): Promise<AutoHrefManifest> {
  const route_dirs = await collect_route_dirs(
    options.routes_dir,
    options.routes_dir,
    [],
  );

  const routes: RouteRecord[] = [];

  /**
   * Convert every route directory into a public manifest record.
   */
  for (const route_dir of route_dirs) {
    const parsed_route = parse_route(route_dir.segments);
    const trailing_slash = await read_trailing_slash(route_dir);
    const entries = await read_entries(route_dir, trailing_slash);

    routes.push({
      id: parsed_route.id,
      pathname: parsed_route.pathname,
      route_kind: route_dir.route_kind,
      params: parsed_route.params,
      templates: parsed_route.templates.flatMap((template) =>
        apply_trailing_slash(template, trailing_slash)
      ),
      completions: parsed_route.completions.flatMap((completion) =>
        apply_trailing_slash(completion, trailing_slash)
      ),
      entries,
    });
  }

  routes.sort((left, right) => left.id.localeCompare(right.id));

  return {
    version: 1,
    routes_dir: options.routes_dir,
    routes,
  };
}

async function collect_route_dirs(
  routes_dir: string,
  current_dir: string,
  segments: string[],
): Promise<RouteDirectory[]> {
  const entries = await readdir(current_dir, { withFileTypes: true });

  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();

  const child_dirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const route_kind = get_route_kind(files);
  const route_dirs: RouteDirectory[] = [];

  if (route_kind) {
    route_dirs.push({
      dir: current_dir,
      segments,
      files,
      route_kind,
    });
  }

  /**
   * Recurse into child route folders in deterministic order.
   */
  for (const child_dir of child_dirs) {
    const nested_route_dirs = await collect_route_dirs(
      routes_dir,
      join(current_dir, child_dir),
      [...segments, child_dir],
    );

    route_dirs.push(...nested_route_dirs);
  }

  return route_dirs;
}

function get_route_kind(files: readonly string[]): RouteKind | undefined {
  const has_page = files.some(is_page_file);
  const has_endpoint = files.some(is_endpoint_file);

  if (has_page && has_endpoint) {
    return "page-and-endpoint";
  }

  if (has_page) {
    return "page";
  }

  if (has_endpoint) {
    return "endpoint";
  }
}

function is_page_file(file: string): boolean {
  return file === "+page.svelte" ||
    file === "+page.sv" ||
    /^\+page(?:\.server)?\.(?:js|ts)$/.test(file);
}

function is_endpoint_file(file: string): boolean {
  return /^\+server\.(?:js|ts)$/.test(file);
}

function parse_route(segments: readonly string[]): ParsedRoute {
  const id = make_route_id(segments);
  const params = collect_params(segments);
  const variants = make_path_variants(segments);
  const first_variant = variants[0] ?? {
    pathname_segments: [],
    template_segments: [],
    completion_segments: [],
  };

  return {
    id,
    pathname: join_url_path(first_variant.pathname_segments),
    params,
    templates: variants.map((variant) =>
      join_url_path(variant.template_segments)
    ),
    completions: variants.map((variant) =>
      join_url_path(variant.completion_segments)
    ),
  };
}

function make_route_id(segments: readonly string[]): string {
  if (segments.length === 0) {
    return "/";
  }

  return `/${segments.join("/")}`;
}

function collect_params(segments: readonly string[]): RouteParam[] {
  const params = new Map<string, RouteParam>();

  for (const segment of segments) {
    const tokens = get_segment_tokens(segment);

    for (const token of tokens) {
      const current = params.get(token.name);

      params.set(token.name, {
        name: token.name,
        matcher: token.matcher ?? current?.matcher,
        optional: token.optional || (current?.optional ?? false),
        rest: token.rest || (current?.rest ?? false),
      });
    }
  }

  return [...params.values()];
}

function make_path_variants(segments: readonly string[]): PathVariant[] {
  let variants: PathVariant[] = [{
    pathname_segments: [],
    template_segments: [],
    completion_segments: [],
  }];

  for (const segment of segments) {
    if (is_group_segment(segment)) {
      continue;
    }

    const tokens = get_segment_tokens(segment);
    const optional_token = get_standalone_optional_token(segment, tokens);

    if (optional_token) {
      variants = variants.flatMap((variant) => [
        variant,
        append_segment_variant(variant, segment, optional_token),
      ]);
      continue;
    }

    variants = variants.map((variant) =>
      append_segment_variant(variant, segment)
    );
  }

  return variants;
}

function append_segment_variant(
  variant: PathVariant,
  segment: string,
  only_token?: SegmentToken,
): PathVariant {
  const pathname_segment = only_token
    ? render_token(only_token, "pathname")
    : render_segment(segment, "pathname");

  const template_segment = only_token
    ? render_token(only_token, "template")
    : render_segment(segment, "template");

  const completion_segment = only_token
    ? render_token(only_token, "completion")
    : render_segment(segment, "completion");

  return {
    pathname_segments: [...variant.pathname_segments, pathname_segment],
    template_segments: [...variant.template_segments, template_segment],
    completion_segments: [...variant.completion_segments, completion_segment],
  };
}

function get_segment_tokens(segment: string): SegmentToken[] {
  const token_regex =
    /\[\[?(\.\.\.)?([A-Za-z_][A-Za-z0-9_]*)(?:=([A-Za-z_][A-Za-z0-9_]*))?\]\]?/g;

  const tokens: SegmentToken[] = [];

  for (const match of segment.matchAll(token_regex)) {
    const raw = match[0];
    const start = match.index ?? 0;

    tokens.push({
      raw,
      name: match[2] ?? "",
      matcher: match[3],
      optional: raw.startsWith("[["),
      rest: Boolean(match[1]),
      start,
      end: start + raw.length,
    });
  }

  return tokens;
}

function get_standalone_optional_token(
  segment: string,
  tokens: readonly SegmentToken[],
): SegmentToken | undefined {
  const token = tokens[0];

  if (tokens.length !== 1 || !token?.optional) {
    return undefined;
  }

  if (token.raw !== segment) {
    return undefined;
  }

  return token;
}

function render_segment(
  segment: string,
  mode: "pathname" | "template" | "completion",
): string {
  const tokens = get_segment_tokens(segment);
  let cursor = 0;
  let output = "";

  for (const token of tokens) {
    output += decode_static_segment(segment.slice(cursor, token.start));
    output += render_token(token, mode);
    cursor = token.end;
  }

  output += decode_static_segment(segment.slice(cursor));

  return output;
}

function render_token(
  token: SegmentToken,
  mode: "pathname" | "template" | "completion",
): string {
  if (mode === "pathname") {
    return token.raw;
  }

  if (mode === "completion") {
    return `\${${token.name}}`;
  }

  return "${string}";
}

function decode_static_segment(segment: string): string {
  return segment.replace(
    /\[x\+([0-9a-fA-F]{2})\]/g,
    (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)),
  );
}

function is_group_segment(segment: string): boolean {
  return segment.startsWith("(") && segment.endsWith(")");
}

function join_url_path(segments: readonly string[]): string {
  const clean_segments = segments.filter((segment) => segment.length > 0);

  if (clean_segments.length === 0) {
    return "/";
  }

  return `/${clean_segments.join("/")}`;
}

async function read_trailing_slash(
  route_dir: RouteDirectory,
): Promise<"always" | "ignore" | "never"> {
  const module_files = get_route_module_files(route_dir);

  for (const file of module_files) {
    const source_text = await readFile(join(route_dir.dir, file), "utf8");
    const match = source_text.match(
      /export\s+const\s+trailingSlash\s*=\s*["'](always|ignore|never)["']/,
    );

    if (match?.[1]) {
      return match[1] as "always" | "ignore" | "never";
    }
  }

  return "never";
}

function apply_trailing_slash(
  pathname: string,
  trailing_slash: "always" | "ignore" | "never",
): string[] {
  if (pathname === "/") {
    return ["/"];
  }

  const without_slash = pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;

  if (trailing_slash === "always") {
    return [`${without_slash}/`];
  }

  if (trailing_slash === "ignore") {
    return [without_slash, `${without_slash}/`];
  }

  return [without_slash];
}

async function read_entries(
  route_dir: RouteDirectory,
  trailing_slash: "always" | "ignore" | "never",
): Promise<string[]> {
  const entry_files = get_entry_files(route_dir);
  const entries = new Set<string>();

  for (const file of entry_files) {
    const file_path = join(route_dir.dir, file);
    const source_text = await readFile(file_path, "utf8");
    const entry_params = extract_literal_entries(source_text, file_path);

    for (const params of entry_params) {
      const pathname = resolve_entry_path(route_dir.segments, params);

      if (!pathname) {
        continue;
      }

      for (
        const trailing_pathname of apply_trailing_slash(
          pathname,
          trailing_slash,
        )
      ) {
        entries.add(trailing_pathname);
      }
    }
  }

  return [...entries].sort();
}

function get_route_module_files(route_dir: RouteDirectory): string[] {
  return route_dir.files.filter((file) =>
    /^\+(?:page(?:\.server)?|server)\.(?:js|ts)$/.test(file)
  );
}

function get_entry_files(route_dir: RouteDirectory): string[] {
  return get_route_module_files(route_dir);
}

function extract_literal_entries(
  source_text: string,
  file_path: string,
): EntryParams[] {
  const source_file = ts.createSourceFile(
    file_path,
    source_text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  const entries: EntryParams[] = [];

  for (const statement of source_file.statements) {
    if (ts.isFunctionDeclaration(statement) && is_exported(statement)) {
      if (statement.name?.text !== "entries" || !statement.body) {
        continue;
      }

      entries.push(...extract_entries_from_block(statement.body));
      continue;
    }

    if (!ts.isVariableStatement(statement) || !is_exported(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) {
        continue;
      }

      if (declaration.name.text !== "entries" || !declaration.initializer) {
        continue;
      }

      entries.push(...extract_entries_from_expression(declaration.initializer));
    }
  }

  return entries;
}

function is_exported(node: ts.Node): boolean {
  const modifiers = ts.canHaveModifiers(node)
    ? ts.getModifiers(node) ?? []
    : [];

  return modifiers.some((modifier) =>
    modifier.kind === ts.SyntaxKind.ExportKeyword
  );
}

function extract_entries_from_expression(
  expression: ts.Expression,
): EntryParams[] {
  const unwrapped = unwrap_expression(expression);

  if (ts.isArrayLiteralExpression(unwrapped)) {
    return extract_entries_from_array(unwrapped);
  }

  if (ts.isArrowFunction(unwrapped)) {
    if (ts.isBlock(unwrapped.body)) {
      return extract_entries_from_block(unwrapped.body);
    }

    return extract_entries_from_expression(unwrapped.body);
  }

  if (ts.isFunctionExpression(unwrapped)) {
    return extract_entries_from_block(unwrapped.body);
  }

  return [];
}

function extract_entries_from_block(block: ts.Block): EntryParams[] {
  for (const statement of block.statements) {
    if (!ts.isReturnStatement(statement) || !statement.expression) {
      continue;
    }

    return extract_entries_from_expression(statement.expression);
  }

  return [];
}

function extract_entries_from_array(
  array: ts.ArrayLiteralExpression,
): EntryParams[] {
  return array.elements
    .map((element) => unwrap_expression(element))
    .filter(ts.isObjectLiteralExpression)
    .map(extract_entry_object)
    .filter((entry) => Object.keys(entry).length > 0);
}

function extract_entry_object(object: ts.ObjectLiteralExpression): EntryParams {
  const entry: EntryParams = {};

  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property)) {
      continue;
    }

    const name = get_property_name(property.name);
    const value = get_literal_value(property.initializer);

    if (!name || !value) {
      continue;
    }

    entry[name] = value;
  }

  return entry;
}

function get_property_name(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
    return name.text;
  }
}

function get_literal_value(expression: ts.Expression): string | undefined {
  const unwrapped = unwrap_expression(expression);

  if (
    ts.isStringLiteral(unwrapped) ||
    ts.isNoSubstitutionTemplateLiteral(unwrapped)
  ) {
    return unwrapped.text;
  }

  if (ts.isNumericLiteral(unwrapped)) {
    return unwrapped.text;
  }
}

function unwrap_expression(expression: ts.Expression): ts.Expression {
  let current = expression;

  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isTypeAssertionExpression(current)
  ) {
    current = current.expression;
  }

  return current;
}

function resolve_entry_path(
  segments: readonly string[],
  params: EntryParams,
): string | undefined {
  const resolved_segments: string[] = [];

  for (const segment of segments) {
    if (is_group_segment(segment)) {
      continue;
    }

    const resolved_segment = resolve_entry_segment(segment, params);

    if (resolved_segment === undefined) {
      return undefined;
    }

    if (resolved_segment.length === 0) {
      continue;
    }

    resolved_segments.push(resolved_segment);
  }

  return join_url_path(resolved_segments);
}

function resolve_entry_segment(
  segment: string,
  params: EntryParams,
): string | undefined {
  const tokens = get_segment_tokens(segment);
  const optional_token = get_standalone_optional_token(segment, tokens);
  let cursor = 0;
  let output = "";

  if (optional_token && params[optional_token.name] === undefined) {
    return "";
  }

  for (const token of tokens) {
    const value = params[token.name];

    if (value === undefined) {
      return undefined;
    }

    output += decode_static_segment(segment.slice(cursor, token.start));
    output += value;
    cursor = token.end;
  }

  output += decode_static_segment(segment.slice(cursor));

  return output;
}

/**
 * Converts a route directory path to route segments. This is mainly useful for
 * tests and editor integrations that receive filesystem paths.
 *
 * @example
 * ```ts
 * const segments = route_segments_from_path("src/routes", "src/routes/blog/[slug]");
 * ```
 *
 * @since 0.1.0
 * @param routes_dir - Root SvelteKit routes directory.
 * @param route_dir - Concrete route directory under `routes_dir`.
 * @returns Filesystem route segments.
 */
export function route_segments_from_path(
  routes_dir: string,
  route_dir: string,
): string[] {
  const relative_path = relative(routes_dir, route_dir);

  if (!relative_path) {
    return [];
  }

  return relative_path.split(sep).filter(Boolean);
}
