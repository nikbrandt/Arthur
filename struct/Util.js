// various utility methods

class Util {
	/**
	 * Similar to Array#map, return an array based on input function
	 * @param {object} object The object to map
	 * @param {function} func The function to call on each object entry, with parameters `key` and `value`. Returning `null` ignores disincludes current iteration.
	 * @returns {Array} The resulting array
	 */
	static objectMap(object, func) {
		let keys = Object.keys(object);
		let values = Object.values(object);

		let out = [];
		for (let i = 0; i < keys.length; i++) {
			let res = func(keys[i], values[i]);
			if (res === null) continue;
			out.push(res);
		}

		return out;
	}
}

module.exports = Util;