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
	// One of: missingModule, badImport, duplicateExport, unusedModule, unusedExport
	type: String;
}

interface MissingModuleIssue extends Issue {
	importingModule: String;
	exportingModule: {
		// Raw value seen in source
		raw: String;
		// Resolved value after aliases
		resolved: String;
	};
	lineNumber: Number;
}

interface BadImportIssue extends Issue {
	importingModule: String;
	exportingModule: {
		// Raw value seen in source
		raw: String;
		// Resolved value after aliases
		resolved: String;
	};
	// One of named, default
	exportType: String;
	// Only for named exports
	exportName?: String;
	lineNumber: Number;
}

interface DuplicateExportIssue extends Issue {
	exportingModule: String;
	// One of named, default
	exportType: String;
	// Only for named exports
	exportName?: String;
	lineNumber: Number;
}

interface UnusedModuleIssue extends Issue {
	module: String;
}

interface UnusedExportIssue extends Issue {
	exportingModule: String;
	// One of named, default
	exportType: String;
	// Only for named exports
	exportName?: String;
	lineNumber: Number;
}