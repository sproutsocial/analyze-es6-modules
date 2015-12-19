var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var analyzeModules = require('../../index');

var scenarios = fs.readdirSync(__dirname).filter(function(file) {
	return fs.lstatSync(path.join(__dirname, file)).isDirectory();
});

if (process.argv[2] && process.argv[2][0] !== '-') {
	runScenario(process.argv[2]);
} else {
	scenarios.forEach(runScenario);
}

function runScenario(scenarioName) {
	var configurationPath = path.join(__dirname, scenarioName, 'configuration.json');
	var configuration = JSON.parse(fs.readFileSync(configurationPath, 'utf8'));

	var options = configuration.options;
	options.cwd = path.join(__dirname, scenarioName);

	analyzeModules(options).then(function(result) {
		var expected = normalizeResult(configuration.result);

		if (!compareResultAndExpected(result, expected)) {
			console.error('Scenario failure: ' + scenarioName);
			console.error('Expected: ' + JSON.stringify(expected));
			console.error('Actual: ' + JSON.stringify(result));
			process.exit(-1);
		} else {
			console.info('Scenario passed: ' + scenarioName);
		}
	}, function(error) {
		console.error('Scenario failure: ' + scenarioName);
		console.error(error && error.stack);
		process.exit(-2);
	});
}

function normalizeResult(result) {
	if (result.modules) {
		result.modules = _.sortByAll(result.modules, ['path']);
	}

	if (result.errors) {
		result.errors = _.sortByAll(result.errors, ['type', 'importingModule', 'exportingModule', 'line']);
	}

	if (result.warnings) {
		result.warnings = _.sortByAll(result.warnings, ['type', 'importingModule', 'exportingModule', 'line']);
	}

	return JSON.parse(JSON.stringify(result));
}

function compareResultAndExpected(actual, expected) {
	// Do the JSON conversion to ensure objects have the same prototypes as well
	actual = JSON.parse(JSON.stringify(actual));
	expected = JSON.parse(JSON.stringify(expected));

	if (!expected.modules && !expected.errors && !expected.warnings) {
		return false;
	}

	if (expected.modules && !_.isEqual(actual.modules, expected.modules)) {
		return false;
	}

	if (expected.errors && !_.isEqual(actual.errors, expected.errors)) {
		return false;
	}

	if (expected.warnings && !_.isEqual(actual.warnings, expected.warnings)) {
		return false;
	}

	return true;
}