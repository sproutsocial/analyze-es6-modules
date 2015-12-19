/**
 * Input options and the output format are documented in the README.
 */
module.exports = function(options) {
	var cwd = options.cwd || process.cwd();

	var readModulesOptions = {
		cwd: cwd,
		sources: options.sources,
		fileReader: options.fileReader || require('./dist/utility').readFileFromFileSystem
	};

	var readModules = require('./dist/read-modules').readModules;

	return readModules(readModulesOptions).then(function(modules) {
		var analyzeModules = require('./dist/analyze-modules').analyzeModules;

		const analyzeOptions = {
			cwd: cwd,
			modules: modules,
			predefinedModules: options.predefined || {}
		};

		return analyzeModules(analyzeOptions);
	});
};