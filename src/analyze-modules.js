export function analyzeModules ({ modules, predefinedModules }) {
	// TODO: Break up into error checking/style linting?
	// TODO: Duplicate exports? (Imports covered by Babel?)
	// TODO: Whitelist (modules that aren't found but exist)
	// TODO: blacklist (modules that are found but shouldn't be used)
	// TODO: Circularly dependent modules

	var errors = [];

	errors = errors.concat(findBadModuleReferences({ modules, predefinedModules }));
	errors = errors.concat(findBadImports({ modules, predefinedModules }));

	return {
		modules, // TODO: Optional
		errors: errors,
		warnings: []
	};
}

function findBadModuleReferences({ modules, predefinedModules }) {
	const modulePaths = modules.map((module) => module.path);

	return modules.reduce((errors, module) => {
		module.imports.forEach((moduleImport) => {
			const source = moduleImport.exportingModule;

			if (modulePaths.indexOf(source) < 0 && !predefinedModules[source]) {
				errors.push({
					type: 'missingModule',
					importingModule: module.path,
					exportingModule: source
				});
			}
		});

		module.exports.forEach((moduleExport) => {
			if (moduleExport.type !== 'batch') {
				return;
			}

			const source = moduleExport.exportingModule;

			if (modulePaths.indexOf(source) < 0  && !predefinedModules[source]) {
				errors.push({
					type: 'missingModule',
					importingModule: module.path,
					exportingModule: source
				});
			}
		});

		return errors;
	}, []);
}

function findBadImports({ modules,  predefinedModules }) {
	const exportMap = buildExportMap(modules);

	return modules.reduce((errors, module) => {
		return module.imports.reduce((errors, moduleImport) => {
			const predefined = predefinedModules[moduleImport.exportingModule];
			const moduleExportMap = exportMap[moduleImport.exportingModule];

			// Module not found, error is reported elsewhere
			if (!predefined && !moduleExportMap) {
				return errors;
			}

			if (predefined) {
				switch (moduleImport.type) {
					case 'default':
						if (predefined === true || (predefined && predefined['default'])) {
							break;
						}

						errors.push({
							type: 'badImport',
							importingModule: module.path,
							exportingModule: moduleImport.exportingModule,
							exportType: 'default'
						});
						break;
					case 'named':
						if (predefined === true) {
							break;
						}

						if (predefined && predefined.named && predefined.named.indexOf(moduleImport.exportName) >= 0) {
							break;
						}

						errors.push({
							type: 'badImport',
							importingModule: module.path,
							exportingModule: moduleImport.exportingModule,
							exportType: 'named',
							exportName: moduleImport.exportName
						});
						break;
				}
			} else {
				switch (moduleImport.type) {
					case 'default':
						if (!moduleExportMap['default']) {
							errors.push({
								type: 'badImport',
								importingModule: module.path,
								exportingModule: moduleImport.exportingModule,
								exportType: 'default'
							});
						}
						break;
					case 'named':
						if (moduleExportMap.named.indexOf(moduleImport.exportName) < 0) {
							errors.push({
								type: 'badImport',
								importingModule: module.path,
								exportingModule: moduleImport.exportingModule,
								exportType: 'named',
								exportName: moduleImport.exportName
							});
						}

						break;
				}
			}

			return errors;
		}, errors);
	}, []);
}

function buildExportMap(modules) {
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
					exports.batch.push(moduleExport.exportingModule);
					break;
			}
		});

		exportMap[module.path] = exports;

		return exportMap;
	}, {});

	return Object.keys(exportMap).reduce((exportMap, path) => {
		exportMap[path] = {
			'default': exportMap[path]['default'],
			named: resolveAllNamedImports(exportMap, path)
		};

		return exportMap;
	}, exportMap);
}

function resolveAllNamedImports(exportMap, path, stack = []) {
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
		return namedImports.concat(resolveAllNamedImports(exportMap, batchPath, newStack));
	}, exportMap[path].named);
}

function findUnusedExports({ modules }) {

}