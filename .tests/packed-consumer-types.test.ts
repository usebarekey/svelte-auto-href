import { expect, test } from "vitest";
import { resolve } from "node:path";

import ts from "typescript";

const fixture_dir = resolve(import.meta.dirname, "fixtures", "packed-consumer");

test("packed declarations reject unknown strict hrefs", () => {
	const config_path = resolve(fixture_dir, "tsconfig.json");
	const config_file = ts.readConfigFile(config_path, (path) => ts.sys.readFile(path));

	expect(config_file.error).toBeUndefined();

	const config = ts.parseJsonConfigFileContent(
		config_file.config,
		ts.sys,
		fixture_dir,
		undefined,
		config_path,
	);
	const program = ts.createProgram({
		options: config.options,
		rootNames: config.fileNames,
	});
	const diagnostics = ts.getPreEmitDiagnostics(program);
	const formatted_diagnostics = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
		getCanonicalFileName: (file) => file,
		getCurrentDirectory: () => fixture_dir,
		getNewLine: () => "\n",
	});

	expect(formatted_diagnostics).toBe("");
});
