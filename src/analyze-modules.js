import StringMultiSet from './StringMultiSet';

export function analyzeModules({ modules, predefinedModules, ignoreUnused }) {
	const exportMap = buildExportMap({ modules, predefinedModules });

	const issues = [].
		concat(findBadModuleReferences({ modules, predefinedModules })).
		concat(findBadImports({ modules, predefinedModules, exportMap })).
		concat(findDuplicateExports({ modules, exportMap })).
		concat(findUnusedModules({ modules, ignoreUnused })).
		concat(findUnusedExports({ modules, ignoreUnused }));

	return { modules, issues };
}

function findBadModuleReferences({ modules, predefinedModules }) {
	const modulePaths = modules.map((module) => module.path);

	return modules.reduce((issues, module) => {
		module.imports.forEach((moduleImport) => {
			const source = moduleImport.exportingModule.resolved;

			if (modulePaths.indexOf(source) < 0 && !predefinedModules[source]) {
				issues.push({
					type: 'missingModule',
					importingModule: module.path,
					exportingModule: moduleImport.exportingModule,
					lineNumber: moduleImport.lineNumber
				});
			}
		});

		module.exports.forEach((moduleExport) => {
			if (moduleExport.type !== 'batch') {
				return;
			}

			const source = moduleExport.exportingModule.resolved;

			if (modulePaths.indexOf(source) < 0  && !predefinedModules[source]) {
				issues.push({
					type: 'missingModule',
					importingModule: module.path,
					exportingModule: moduleExport.exportingModule,
					lineNumber: moduleExport.lineNumber
				});
			}
		});

		return issues;
	}, []);
}

function findBadImports({ modules,  predefinedModules, exportMap }) {
	return modules.reduce((issues, module) => {
		return module.imports.reduce((issues, moduleImport) => {
			const predefined = predefinedModules[moduleImport.exportingModule.resolved];
			const moduleExportMap = exportMap[moduleImport.exportingModule.resolved];

			// Module not found, error is reported elsewhere
			if (!predefined && !moduleExportMap) {
				return issues;
			}

			if (predefined) {
				switch (moduleImport.type) {
					case 'default':
						if (predefined === true || (predefined && predefined['default'])) {
							break;
						}

						issues.push({
							type: 'badImport',
							importingModule: module.path,
							exportingModule: moduleImport.exportingModule,
							exportType: 'default',
							lineNumber: moduleImport.lineNumber
						});
						break;
					case 'named':
						if (predefined === true) {
							break;
						}

						if (predefined && predefined.named && predefined.named.indexOf(moduleImport.exportName) >= 0) {
							break;
						}

						issues.push({
							type: 'badImport',
							importingModule: module.path,
							exportingModule: moduleImport.exportingModule,
							exportType: 'named',
							exportName: moduleImport.exportName,
							lineNumber: moduleImport.lineNumber
						});
						break;
				}
			} else {
				switch (moduleImport.type) {
					case 'default':
						if (!moduleExportMap['default']) {
							issues.push({
								type: 'badImport',
								importingModule: module.path,
								exportingModule: moduleImport.exportingModule,
								exportType: 'default',
								lineNumber: moduleImport.lineNumber
							});
						}
						break;
					case 'named':
						if (moduleExportMap.named.indexOf(moduleImport.exportName) < 0) {
							issues.push({
								type: 'badImport',
								importingModule: module.path,
								exportingModule: moduleImport.exportingModule,
								exportType: 'named',
								exportName: moduleImport.exportName,
								lineNumber: moduleImport.lineNumber
							});
						}

						break;
				}
			}

			return issues;
		}, issues);
	}, []);
}

function findDuplicateExports({ modules, exportMap }) {
	return modules.reduce((issues, module) => {
		// TODO: Duplicate default exports?
		const namedExports = exportMap[module.path].named;
		const namedSet = new StringMultiSet(namedExports);

		if (namedExports.length !== namedSet.size) {
			namedSet.items.forEach((name) => {
				if (namedSet.count(name) > 1) {
					issues.push({
						type: 'duplicateExport',
						exportingModule: module.path,
						exportType: 'named',
						exportName: name,
						lineNumber: 0 // TODO
					});
				}
			});
		}

		return issues;
	}, []);
}

function findUnusedModules({ modules, ignoreUnused }) {
	const importMap = {};

	modules.forEach((module) => {
		module.imports.forEach((moduleImport) => {
			importMap[moduleImport.exportingModule.resolved] = true;
		});

		module.exports.forEach((moduleExport) => {
			if (moduleExport.type === 'batch') {
				importMap[moduleExport.exportingModule.resolved] = true;
			}
		});
	});

	return modules.reduce((issues, module) => {
		if (!importMap[module.path] && ignoreUnused[module.path] !== true) {
			issues.push({
				type: 'unusedModule',
				module: module.path
			});
		}

		return issues;
	}, []);
}

function findUnusedExports({ modules, ignoreUnused }) {
	const importMap = modules.reduce((importMap, module) => {
		importMap[module.path] = {
			batch: false,
			'default': false,
			named: []
		};

		return importMap;
	}, {});

	modules.forEach((module) => {
		module.imports.forEach((moduleImport) => {
			// Either a predefined or non-existent module.
			if (!importMap[moduleImport.exportingModule.resolved]) {
				return;
			}

			switch (moduleImport.type) {
				case 'batch':
					importMap[moduleImport.exportingModule.resolved].batch = true;
					break;
				case 'default':
					importMap[moduleImport.exportingModule.resolved]['default'] = true;
					break;
				case 'named':
					importMap[moduleImport.exportingModule.resolved].named.push(moduleImport.exportName);
					break;
				case 'sideEffect':
					// This only checks for unused exports. Unused modules are checked elsewhere.
					break;
			}
		});

		module.exports.forEach((moduleExport) => {
			if (moduleExport.type === 'batch') {
				// Make sure it's not a predefined or non-existent module.
				if (importMap[moduleExport.exportingModule.resolved]) {
					importMap[moduleExport.exportingModule.resolved].batch = true;
				}
			}
		});
	});

	return modules.reduce((issues, module) => {
		module.exports.forEach((moduleExport) => {
			if (importMap[module.path].batch) {
				return;
			}

			const unused = ignoreUnused[module.path];

			if (unused === true) {
				return;
			}

			switch (moduleExport.type) {
				case 'default':
					if (unused && unused['default']) {
						break;
					}

					if (!importMap[module.path]['default']) {
						issues.push({
							type: 'unusedExport',
							exportingModule: module.path,
							exportType: 'default',
							lineNumber: 0 // TODO
						});
					}
					break;
				case 'named':
					if (unused && unused.named && unused.named.indexOf(moduleExport.exportName) >= 0) {
						break;
					}

					if (importMap[module.path].named.indexOf(moduleExport.exportName) < 0) {
						issues.push({
							type: 'unusedExport',
							exportingModule: module.path,
							exportType: 'named',
							exportName: moduleExport.exportName,
							lineNumber: 0 // TODO
						});
					}
					break;
			}
		});

		return issues;
	}, []);
}

function buildExportMap({ modules, predefinedModules }) {
	const exportMap = modules.reduce((exportMap, module) => {
		const exports = {
			'default': false,
			named: [],
			batch: []
		};

		module.exports.forEach((moduleExport) => {
			switch (moduleExport.type) {
				case 'default':
					exports['default'] = true;
					break;
				case 'named':
					exports.named.push(moduleExport.exportName);
					break;
				case 'batch':
					exports.batch.push(moduleExport.exportingModule.resolved);
					break;
			}
		});

		exportMap[module.path] = exports;

		return exportMap;
	}, {});

	return Object.keys(exportMap).reduce((exportMap, path) => {
		exportMap[path] = {
			'default': exportMap[path]['default'],
			named: resolveAllNamedImports(predefinedModules, exportMap, path)
		};

		return exportMap;
	}, exportMap);
}

function resolveAllNamedImports(predefinedModules, exportMap, path, stack = []) {
	if (predefinedModules[path]) {
		return predefinedModules[path].named || [];
	}

	// Missing module errors are reported elsewhere
	if (!exportMap[path]) {
		return [];
	}

	if (stack.indexOf(path) >= 0) {
		return exportMap[path].named;
	}

	const batchExports = exportMap[path].batch || [];

	return batchExports.reduce((namedImports, batchPath) => {
		const newStack = stack.concat([path]);
		return namedImports.concat(resolveAllNamedImports(predefinedModules, exportMap, batchPath, newStack));
	}, exportMap[path].named);
}