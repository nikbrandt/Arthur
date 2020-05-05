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

	/**
	 * Convert an input duration into a human readable time string (e.g. 4h 22m 39s)
	 * @param {number} seconds The input duration, in seconds
	 * @param {Message|Guild|User|string} resolvable A resolvable for use with i18n (to get the 'h', 'm', and 's')
	 */
	static timeString(seconds, resolvable) {
		let h = i18n.get('time.abbreviations.hours', resolvable);
		let m = i18n.get('time.abbreviations.minutes', resolvable);
		let s = i18n.get('time.abbreviations.seconds', resolvable);

		let hours = Math.floor(seconds / 3600);
		seconds -= hours * 3600;

		let mins = Math.floor(seconds / 60);
		seconds -= mins * 60;

		return (hours ? hours + h + ' ' : '') + (mins ? mins + m + ' ' : '') + seconds + s;
	}
}

module.exports = Util;