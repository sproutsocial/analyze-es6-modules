const fs = require('fs');
const path = require('path');
const glob = require('glob');
const Promise = require('bluebird');

const expandFilePatterns = (cwd, patterns) => {
	const sources = patterns.filter((pattern) => pattern[0] !== '!');
	const ignore = patterns.
		filter((pattern) => pattern[0] === '!').
		map((pattern) => pattern.substring(1)).
		concat(['node_modules/**']);

	const globSearches = sources.map((pattern) => {
		return new Promise((resolve, reject) => {
			const options = { cwd, ignore };

			glob(pattern, options, (error, filePaths) => {
				if (error) {
					reject(error);
				} else {
					resolve(filePaths);
				}
			});
		});
	});

	return Promise.all(globSearches).then((allMatches) => {
		const allPaths = {};

		for (let i = 0; i < allMatches.length; ++i) {
			const matches = allMatches[i];

			for (let j = 0; j < matches.length; ++j) {
				const absolute = path.resolve(cwd, matches[j]);

				allPaths[absolute] = true;
			}
		}

		return Object.keys(allPaths);
	});
};

const readFileFromFileSystem = (filePath) => {
	return new Promise((resolve, reject) => {
		fs.readFile(filePath, 'utf8', (error, contents) => {
			if (error) {
				reject(error);
			} else {
				resolve(contents);
			}
		});
	});
};

export {
	expandFilePatterns,
	readFileFromFileSystem
};