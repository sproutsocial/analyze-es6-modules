interface Output {
	modules: Array<Module>;
	issues: Array<Issue>;
}

interface Module {
	path: String;
	imports: Array<ModuleImport>;
	exports: Array<ModuleExport>;
}

interface ModuleImport {
	// One of: sideEffect, batch, named, default
	type: String;
	// Only for `named` type
	exportName?: String;
	// The imported module
	exportingModule: {
		// Raw value seen in source
		raw: String;
		// Resolved value after aliases
		resolved: String;
	};
	lineNumber: Number;
}

interface ModuleExport {
	// One of: batch, named, default
	type: String;
	// Only for `named` type
	exportName?: String;
	// Only for the `batch` type
	exportingModule?: {
		// Raw value seen in source
		raw: String;
		// Resolved value after aliases
		resolved: String;
	};
	lineNumber: Number;
}

interface Issue {
	// One of: missingModule, badImport
	type: String;
	// The module the issue occurred in
	importingModule: String;
	exportingModule?: {
		// Raw value seen in source
		raw: String;
		// Resolved value after aliases
		resolved: String;
	};
	// Only for `badImport` type
	// One of: named, default
	exportType: String;
	// Only for `badImport` type with `named` exportType
	exportName: String;
	lineNumber: Number;
}