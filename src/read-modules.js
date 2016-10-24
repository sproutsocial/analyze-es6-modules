import Module from './module';

import { expandFilePatterns } from './utility';

const pathModule = require('path');
const babel = require('babel-core');
const Promise = require('bluebird');

class ModuleParser {
	constructor({ cwd, aliases, filePath, resolveModulePath, ast }) {
		this.cwd = cwd;
		this.aliases = aliases;
		this.filePath = filePath;
		this.resolveModulePath = resolveModulePath;
		this.ast = ast;
	}

	parseModule() {
		// Get the relative path, remove the leading dot and slash, then remove the file extension
		const modulePath = pathModule.relative(this.cwd, this.filePath).replace(/^\.\//g, '').replace(/\.[^/.]+$/g, '');
		const module = new Module(modulePath);

		this.ast.program.body.forEach((declaration) => {
			switch (declaration.type) {
				case 'ImportDeclaration':
					this.handleImportDeclaration(module, declaration);
					break;
				case 'ExportAllDeclaration':
					this.handleExportAllDeclaration(module, declaration);
					break;
				case 'ExportNamedDeclaration':
					this.handleExportNamedDeclaration(module, declaration);
					break;
				case 'ExportDefaultDeclaration':
					this.handleExportDefaultDeclaration(module, declaration);
					break;
			}
		});

		return module;
	}

	handleImportDeclaration(module, declaration) {
		const rawSourcePath = declaration.source.value;
		const sourcePath = this.resolveImportModulePath(module.path, rawSourcePath);

		if (declaration.specifiers.length === 0) {
			module.addSideEffectImport({
				sourcePath, rawSourcePath,
				lineNumber: declaration.loc.start.line
			});
			return;
		}

		declaration.specifiers.forEach((specifier) => {
			const lineNumber = specifier.loc.start.line;

			switch (specifier.type) {
				case 'ImportSpecifier':
					const exportName = specifier.imported.name;

					if (exportName === 'default') {
						module.addDefaultImport({ sourcePath, rawSourcePath, lineNumber });
					} else {
						module.addNamedImport({ exportName, sourcePath, rawSourcePath, lineNumber });
					}
					break;
				case 'ImportDefaultSpecifier':
					module.addDefaultImport({ sourcePath, rawSourcePath, lineNumber });
					break;
				case 'ImportNamespaceSpecifier':
					module.addBatchImport({ sourcePath, rawSourcePath, lineNumber });
					break;
			}
		});
	}

	handleExportAllDeclaration(module, declaration) {
		const rawSourcePath = declaration.source.value;
		const sourcePath = this.resolveImportModulePath(module.path, rawSourcePath);
		const lineNumber = declaration.loc.start.line;

		module.addBatchExport({ sourcePath, rawSourcePath, lineNumber });
	}

	handleExportNamedDeclaration(module, declaration) {
		if (declaration.source) {
			declaration.specifiers.forEach((specifier) => {
				const rawSourcePath = declaration.source.value;
				const sourcePath = this.resolveImportModulePath(module.path, rawSourcePath);


				module.addReExport({
					exportedName: specifier.exported.name,
					importedName: specifier.local.name, source,
					rawSourcePath,
					sourcePath,
					lineNumber: specifier.loc.start.line
				});
			});
		} else if (declaration.declaration) {
			if (declaration.declaration.type === 'FunctionDeclaration') {
				module.addNamedExport({
					exportName: declaration.declaration.id.name,
					lineNumber: declaration.declaration.loc.start.line
				});
			} else if (declaration.declaration.type === 'VariableDeclaration') {
				declaration.declaration.declarations.forEach((d) => {
					module.addNamedExport({
						exportName: d.id.name,
						lineNumber: d.loc.start.line
					});
				});
			}
		} else if (declaration.specifiers) {
			declaration.specifiers.forEach((specifier) => {
				const exportName = specifier.exported.name;
				const lineNumber = specifier.loc.start.line;

				if (exportName === 'default') {
					module.addDefaultExport({ lineNumber });
				} else {
					module.addNamedExport({ exportName, lineNumber });
				}
			});
		}
	}

	handleExportDefaultDeclaration(module, declaration) {
		const lineNumber = declaration.loc.start.line;

		module.addDefaultExport({ lineNumber });
	}

	resolveImportModulePath(importingModulePath, exportingModuleRelativePath) {
		const resolveOptions = { cwd: this.cwd, path: exportingModuleRelativePath, importingModulePath };
		const userResolvedPath = this.resolveModulePath(resolveOptions);
		if (userResolvedPath !== undefined) {
			return userResolvedPath;
		}

		if (exportingModuleRelativePath[0] === '.') {
			const fullImportModulePath = pathModule.join(this.cwd, importingModulePath);
			const importingModuleDirectory = fullImportModulePath.replace(/\/[^/]+$/g, '');
			const exportingModulePath = pathModule.resolve(importingModuleDirectory, exportingModuleRelativePath);
			// Get the relative path and remove the leading dot and slash
			return pathModule.relative(this.cwd, exportingModulePath).replace(/^\.\//g, '');
		}

		const aliased = this.applyAliases(exportingModuleRelativePath);
		if (exportingModuleRelativePath !== aliased) {
			return aliased;
		}

		return exportingModuleRelativePath;
	}

	applyAliases(modulePath) {
		if (this.aliases.module[modulePath]) {
			return this.aliases.module[modulePath];
		}

		for (const prefix in this.aliases.path) {
			if (this.aliases.path.hasOwnProperty(prefix)) {
				if (modulePath.indexOf(prefix) === 0) {
					const rest = modulePath.slice(prefix.length);
					const fullPath = pathModule.join(this.cwd, this.aliases.path[prefix], rest);
					const absolutePath = pathModule.resolve(fullPath);

					return pathModule.relative(this.cwd, absolutePath);
				}
			}
		}

		return modulePath;
	}

}

export function readModules({ cwd, sources, aliases, resolveModulePath, fileReader, babel: userBabelOptions }) {
	const babelOptions = {
		compact: false,
		plugins: userBabelOptions.plugins || []
	};

	return expandFilePatterns(cwd, sources).then((filePaths) => {
		const modulePromises = filePaths.map((filePath) => {
			return fileReader(filePath).then((fileContents) => {
				try {
					const ast = babel.transform(fileContents, babelOptions).ast;

					const moduleParser = new ModuleParser({ cwd, filePath, aliases, resolveModulePath, ast });
					return moduleParser.parseModule();
				} catch (error) {
					throw generateParsingErrorMessage(filePath, error);
				}
			});
		});

		return Promise.all(modulePromises);
	});
}

function generateParsingErrorMessage(filePath, error) {
	return `Parsing error: ${filePath}\n${error ? (error.stack || error.message) : ''}`;
}