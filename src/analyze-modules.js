export function analyzeModules({ modules, predefinedModules }) {
	let issues = [];

	issues = issues.concat(findBadModuleReferences({ modules, predefinedModules }));
	issues = issues.concat(findBadImports({ modules, predefinedModules }));

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

function findBadImports({ modules,  predefinedModules }) {
	const exportMap = buildExportMap({ modules,  predefinedModules });

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

function findUnusedExports({ modules }) {

}