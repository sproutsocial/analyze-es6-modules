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

	var options = normalizeOptions(configuration.options, scenarioName);

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
		if (configuration.errorMessages) {
			if (!compareErrors(error, configuration.errorMessages)) {
				console.error('Scenario failure: ' + scenarioName);
				console.error('Expected errors: ' + configuration.errorMessages.join(', '));
				console.error('Actual error: ' + error);
				process.exit(-1);
			} else {
				console.info('Scenario passed: ' + scenarioName);
			}
		} else {
			console.error('Scenario failure: ' + scenarioName);
			console.error(error && error.stack);
			process.exit(-2);
		}
	});
}

function normalizeOptions(options, scenarioName) {
	options = options || {};
	options.cwd = path.join(__dirname, scenarioName);
	options.sources = options.sources || ["**/*.js"];
	options.ignoreUnused = options.ignoreUnused || {};
	options.ignoreUnused['index'] = true;

	return options;
}

function normalizeResult(result) {
	if (result.modules) {
		result.modules = _.sortByAll(result.modules, ['path']);
	}

	if (result.issues) {
		result.issues = _.sortByAll(result.issues, ['type', 'importingModule', 'exportingModule.resolved', 'line']);
	}

	return JSON.parse(JSON.stringify(result));
}

function compareResultAndExpected(actual, expected) {
	// Do the JSON conversion to ensure objects have the same prototypes as well
	actual = JSON.parse(JSON.stringify(actual));
	expected = JSON.parse(JSON.stringify(expected));

	if (!expected.modules && !expected.issues) {
		return false;
	}

	if (expected.modules && !_.isEqual(actual.modules, expected.modules)) {
		return false;
	}

	if (expected.issues && !_.isEqual(actual.issues, expected.issues)) {
		return false;
	}

	return true;
}

function compareErrors(actual, expected) {
	if (typeof actual !== 'string' || !Array.isArray(expected)) {
		return false;
	}

	for (var i = 0; i < expected.length; ++i) {
		if (actual.toLocaleLowerCase().indexOf(expected[i].toLocaleLowerCase()) < 0) {
			return false;
		}
	}

	return true;
}