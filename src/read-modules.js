import Module from './module';

import { expandFilePatterns } from './utility';

const pathModule = require('path');
const babel = require('babel-core');
const Promise = require('bluebird');

class ModuleParser {
	constructor({ cwd, filePath, ast }) {
		this.cwd = cwd;
		this.filePath = filePath;
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
		const source = this.resolveImportModulePath(module.path, declaration.source.value);

		if (declaration.specifiers.length === 0) {
			module.addSideEffectImport(source);
			return;
		}

		declaration.specifiers.forEach((specifier) => {
			switch (specifier.type) {
				case 'ImportSpecifier':
					if (specifier.imported.name === 'default') {
						module.addDefaultImport(source);
					} else {
						module.addNamedImport(specifier.imported.name, source);
					}
					break;
				case 'ImportDefaultSpecifier':
					module.addDefaultImport(source);
					break;
				case 'ImportNamespaceSpecifier':
					module.addBatchImport(source);
					break;
			}
		});
	}

	handleExportAllDeclaration(module, declaration) {
		const source = this.resolveImportModulePath(module.path, declaration.source.value);
		module.addBatchExport(source);
	}

	handleExportNamedDeclaration(module, declaration) {
		if (declaration.source) {
			declaration.specifiers.forEach((specifier) => {
				const source = this.resolveImportModulePath(module.path, declaration.source.value);
				module.addReExport(specifier.exported.name, specifier.local.name, source);
			});
		} else if (declaration.declaration) {
			if (declaration.declaration.type === 'FunctionDeclaration') {
				module.addNamedExport(declaration.declaration.id.name);
			} else if (declaration.declaration.type === 'VariableDeclaration') {
				declaration.declaration.declarations.forEach((d) => {
					module.addNamedExport(d.id.name);
				});
			}
		} else if (declaration.specifiers) {
			declaration.specifiers.forEach((specifier) => {
				if (specifier.exported.name === 'default') {
					module.addDefaultExport();
				} else {
					module.addNamedExport(specifier.exported.name);
				}
			});
		}
	}

	handleExportDefaultDeclaration(module, declaration) {
		module.addDefaultExport();
	}

	resolveImportModulePath(importingModulePath, exportingModuleRelativePath) {
		// TODO: Check aliases

		if (exportingModuleRelativePath[0] !== '.') {
			return exportingModuleRelativePath;
		}

		const fullImportModulePath = pathModule.join(this.cwd, importingModulePath);
		const importingModuleDirectory = fullImportModulePath.replace(/\/[^/]+$/g, '');
		const exportingModulePath = pathModule.resolve(importingModuleDirectory, exportingModuleRelativePath);
		// Get the relative path and remove the leading dot and slash
		return pathModule.relative(this.cwd, exportingModulePath).replace(/^\.\//g, '');
	}
}

export function readModules({ cwd, sources, fileReader }) {
	return expandFilePatterns(cwd, sources).then((filePaths) => {
		const modulePromises = filePaths.map((filePath) => {
			return fileReader(filePath).then((fileContents) => {
				const ast = babel.transform(fileContents).ast;

				const moduleParser = new ModuleParser({ cwd, filePath, ast });
				return moduleParser.parseModule();
			});
		});

		return Promise.all(modulePromises);
	});
}