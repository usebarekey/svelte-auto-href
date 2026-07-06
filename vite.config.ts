export default {
	fmt: {
		ignorePatterns: [".dist/**", "dist/**"],
		tabWidth: 4,
		useTabs: true,
	},
	lint: {
		ignorePatterns: [".dist/**", "dist/**"],
		options: { typeAware: true, typeCheck: true },
	},
	pack: {
		deps: {
			neverBundle: ["typescript"],
		},
		dts: true,
		entry: [
			"src/mod.ts",
			"src/vite.ts",
			"src/editor.ts",
			"src/generator.ts",
			"src/html-data-renderer.ts",
			"src/init.ts",
			"src/cli.ts",
			"src/manifest.ts",
			"src/route-scanner.ts",
			"src/type-renderer.ts",
		],
		format: ["esm"],
		sourcemap: true,
	},
};
