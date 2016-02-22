# analyze-es6-modules [![Build Status](https://travis-ci.org/sproutsocial/analyze-es6-modules.svg?branch=master)](https://travis-ci.org/sproutsocial/analyze-es6-modules)

analyze-es6-modules is a program that reads and statically analyzes ES6 module statements in your Javascript project. It builds a list of all modules in your project, including their imports and exports, then determines if those imports and exports align. It can warn about mistakes such as bad module references or bad imports, and even warn about unused exports. The task is highly configurable so that it can adapt to a wide range of projects.
 
## Usage
 
This module exports only a single function that returns an A+ promise, so it can be used like so:

```js
var analyzeModules = require('analyze-es6-modules');

analyzeModules(configuration).then(resolvedHandler, rejectedHandler);
```

### Configuration

The exported function takes an object of configuration options that are described below.

- `cwd`: The main root of your project. All of your sources should lie somewhere in this directory tree. If left out, `process.cwd()` will be used instead.
- `sources`: An array of [globbing patterns](https://github.com/isaacs/node-glob) that point to your source files. You can prefix any globbing pattern with a `!` to specifically _exclude_ those files (this goes against what the `node-glob` documentation says). Your patterns should only point to files that contain Javascript source code, do not include any other type of file as it will cause errors.
- `fileReader`: A function that takes an absolute file path and returns a promise that resolves to the contents of the file. If left out a function that reads from the file system will be used. But you can override this function if you have a more efficient way of getting file contents (such as a cache or stream).
- `aliases`: An object that contains module aliases used in your sources. There are two types of aliases: module aliases and path aliases. Module aliases are direct 1-to-1 mappings from one module to another. Path aliases are path prefixes used to create shortcuts and redirects. The format is better seen in the example below:

 ```js
 const aliases = {
    module: {
        // When you import from `config`, it'll actually import from `source/config/all`
        // Note that module aliases can NOT be relative paths.
        'config': 'source/config/all'
    },
    path: {
        // This makes all `app/*` references point to the root of your project
        // Note that the prefix must end with a slash
        // The destination is relative to your project root, must begin with a dot, and cannot end with a slash
        'app/': '.',
        // This will route something like `util/time` to `source/misc/util/time`
        'util/': './source/misc/util'
    }
 }
 ```
- `babel`: These are options that may be passed to Babel when parsing. At this time only plugins are supported. By using plugins you can expand the available syntax to include non-standard synatx (like JSX or Flow).

 ```js
 {
     "plugins": [require('babel-plugin-syntax-jsx'), require('babel-plugin-syntax-flow')]
 }
 ```
- `predefined`: This is an object containing modules that can be used but do not exist within your project directly. This is where you can include module descriptions for things like third-party libraries.

 ```js
 {
     // Using `true` will allow you to import anything from the `d3` module
     "d3": true,
     // This will only allow you to import a default import from the `jQuery` module
     "jQuery": {
         'default': true
     },
     // This will only allow you to import the `forEach` and `filter` named exports from `lodash`
     "lodash": {
         'default': false,
         named: ['forEach', 'filter']
     }
 }
 ```
- `ignoreUnused`: This is an object containing rules for ignoring unused warnings for modules and exports.

 ```js
 {
     // Using `true` will ignore any unused warnings from that module
     "index": true,
     // This will ignore unused default export warnings
     "class": {
         'default': true
     },
     // This will ignore unused named export warnings for 'pi' and 'e'
     "math": {
         'default': false,
         named: ['pi', 'e']
     }
 }
 ```
- `resolveModulePath`: A function that can replace any module path with an arbitrary user-defined module. The function receives a single object argument with three properties:
 - `cwd`: The analyzer's current working directory
 - `path`: The path that can be resolved to a different path
 - `importingModulePath`: The resolved path of the module importing the path above
 The function can either return a string which is the new path that will be used, or `undefined` to signal that the path should be resolved in the default manner.
 
 Note that this function is called **before** any other kind of resolution is done, including aliases. Here's a usage example:
 
 ```js
 resolveModulePath: function(options) {
     if (options.path.indexOf('/old_directory/') >= 0) {
         return options.path.replace('/old_directory/', '/new_directory/');
     }
     
     if (options.path === 'config') {
         return 'app/configuration/main';
     }
 }
 ```
 
### Output

The output format is still somewhat in flux, but should remain mostly backwards compatible. You can find a description of it using Typescript interfaces [here](doc/output-types.d.ts). For more real-world examples, check out the test scenarios [here](test/scenarios). The output format was designed to be flexible enough to report the issues in a project-specific manner.
 
### Plugins

A Grunt plugin can be found [here](https://github.com/sproutsocial/grunt-analyze-es6-modules).

## Development

TODO
