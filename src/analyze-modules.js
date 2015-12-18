export function analyzeModules ({ modules }) {
	// TODO: Break up into error checking/style linting?
	// TODO: Duplicate exports? (Imports covered by Babel?)
	// TODO: Whitelist (modules that aren't found but exist)
	// TODO: blacklist (modules that are found but shouldn't be used)
	// TODO: Circularly dependent modules

	var errors = [];

	errors = errors.concat(findBadModuleReferences({ modules }));
	errors = errors.concat(findBadImports({ modules }));

	return {
		modules, // TODO: Optional
		errors: errors
	};
}

function findBadModuleReferences({ modules }) {
	const modulePaths = modules.map((module) => module.path);

	return modules.reduce((errors, module) => {
		module.imports.forEach((moduleImport) => {
			const source = moduleImport.exportingModule;

			if (modulePaths.indexOf(source) < 0) {
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

			if (modulePaths.indexOf(source) < 0) {
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

function findBadImports({ modules }) {
	const exportMap = buildExportMap(modules);

	return modules.reduce((errors, module) => {
		return module.imports.reduce((errors, moduleImport) => {
			const moduleExportMap = exportMap[moduleImport.exportingModule];

			// Module not found, error is reported elsewhere
			if (!moduleExportMap) {
				return errors;
			}

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

			return errors;
		}, errors);
	}, []);
}

function buildExportMap(modules) {
	return modules.reduce((exportMap, module) => {
		const exports = {
			'default': false,
			named: []
		};

		module.exports.forEach((moduleExport) => {
			switch (moduleExport.type) {
				case 'default':
					exports['default'] = true;
					break;
				case 'named':
					exports.named.push(moduleExport.exportName);
					break;
			}
		});

		exportMap[module.path] = exports;

		return exportMap;
	}, {});
}

function findUnusedExports({ modules }) {

}