export default class Module {
	constructor(path) {
		this.path = path;

		this.imports = [];
		this.exports = [];
	}

	addNamedImport({ exportName, sourcePath, rawSourcePath, lineNumber }) {
		this.imports.push({
			type: 'named',
			exportName,
			exportingModule: {
				raw: rawSourcePath,
				resolved: sourcePath
			},
			lineNumber
		});
	}

	addDefaultImport({ sourcePath, rawSourcePath, lineNumber }) {
		this.imports.push({
			type: 'default',
			exportingModule: {
				raw: rawSourcePath,
				resolved: sourcePath
			},
			lineNumber
		});
	}

	addBatchImport({ sourcePath, rawSourcePath, lineNumber }) {
		this.imports.push({
			type: 'batch',
			exportingModule: {
				raw: rawSourcePath,
				resolved: sourcePath
			},
			lineNumber
		});
	}

	addSideEffectImport({ sourcePath, rawSourcePath, lineNumber }) {
		this.imports.push({
			type: 'sideEffect',
			exportingModule: {
				raw: rawSourcePath,
				resolved: sourcePath
			},
			lineNumber
		});
	}

	addBatchExport({ sourcePath, rawSourcePath, lineNumber }) {
		this.exports.push({
			type: 'batch',
			exportingModule: {
				raw: rawSourcePath,
				resolved: sourcePath
			},
			lineNumber
		});
	}

	addReExport({ exportedName, importedName, sourcePath, rawSourcePath, lineNumber }) {
		this.addNamedImport({ exportName: importedName, sourcePath, rawSourcePath });

		if (exportedName === 'default') {
			this.addDefaultExport({ lineNumber });
		} else {
			this.addNamedExport({ name: exportedName, lineNumber });
		}
	}

	addNamedExport({ exportName, lineNumber }) {
		this.exports.push({
			type: 'named',
			exportName,
			lineNumber
		});
	}

	addDefaultExport({ lineNumber }) {
		this.exports.push({
			type: 'default',
			lineNumber
		});
	}

	toJSON() {
		return {
			path: this.path,
			imports: this.imports,
			exports: this.exports
		};
	}

}