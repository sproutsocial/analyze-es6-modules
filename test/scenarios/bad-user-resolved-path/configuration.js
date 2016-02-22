module.exports = {
	options: {
		resolveModulePath: function(options) {
			if (options.path === 'some-weird-path') {
				return 'non-existent';
			}
		}
	},
	'result': {
		'issues': [
			{
				type: 'missingModule',
				importingModule: 'index',
				exportingModule: {
					raw: 'some-weird-path',
					resolved: 'non-existent'
				},
				'lineNumber': 2
			},
			{
				type: 'unusedModule',
				module: 'util'
			}
		],
		'modules': [
			{
				'path': 'index',
				'exports': [],
				'imports': [
					{
						'type': 'sideEffect',
						'exportingModule': {
							'raw': 'other',
							'resolved': 'other'
						},
						'lineNumber': 1
					},
					{
						'type': 'sideEffect',
						'exportingModule': {
							'raw': 'some-weird-path',
							'resolved': 'non-existent'
						},
						'lineNumber': 2
					}
				]
			},
			{
				'path': 'other',
				'imports': [],
				'exports': []
			},
			{
				'path': 'util',
				'imports': [],
				'exports': []
			}
		]
	}
};