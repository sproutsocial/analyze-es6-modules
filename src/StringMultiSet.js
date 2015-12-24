export default class StringMultiSet {
	constructor(strings) {
		this.strings = {};

		strings.forEach(this.add.bind(this));
	}

	get items() {
		return Object.keys(this.strings);
	}

	add(string) {
		if (this.strings[string]) {
			this.strings[string] += 1;
		} else {
			this.strings[string] = 1;
		}
	}

	has(string) {
		return (this.strings[string] && this.strings[string] > 0);
	}

	get size() {
		return this.items.length;
	}

	count(string) {
		return (this.strings[string] || 0);
	}
}