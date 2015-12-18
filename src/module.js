export default class Module {
	constructor(path) {
		this.path = path;

		this.imports = [];
		this.exports = [];
	}

	addNamedImport(name, sourceModulePath) {
		this.imports.push({
			type: 'named',
			exportingModule: sourceModulePath,
			exportName: name
		});
	}

	addDefaultImport(sourceModulePath) {
		this.imports.push({
			type: 'default',
			exportingModule: sourceModulePath
		});
	}

	addBatchImport(sourceModulePath) {
		this.imports.push({
			type: 'batch',
			exportingModule: sourceModulePath
		});
	}

	addSideEffectImport(sourceModulePath) {
		this.imports.push({
			type: 'sideEffect',
			exportingModule: sourceModulePath
		});
	}

	addBatchExport(sourceModulePath) {
		this.exports.push({
			type: 'batch',
			exportingModule: sourceModulePath
		});
	}

	addReExport(exportedName, importedName, sourceModulePath) {
		this.addNamedImport(importedName, sourceModulePath);

		if (exportedName === 'default') {
			this.addDefaultExport();
		} else {
			this.addNamedExport(exportedName);
		}
	}

	addNamedExport(name) {
		this.exports.push({
			type: 'named',
			exportName: name
		});
	}

	addDefaultExport() {
		this.exports.push({
			type: 'default'
		});
	}

	/**
	 * For debugging purposes
	 */
	toJSON() {
		return {
			path: this.path,
			imports: this.imports,
			exports: this.exports
		};
	}

}