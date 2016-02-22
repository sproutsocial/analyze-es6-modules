module.exports = {
	options: {
		resolveModulePath: function(options) {
			if (options.path === 'some-weird-path') {
				return 'util';
			}
		}
	},
	'result': {
		'issues': [],
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
							'resolved': 'util'
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