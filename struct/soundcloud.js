const request = require('request');
const config = require('../../media/config.json');
const clientID = config.soundcloudID;

const soundcloudRegex = /^(https:\/\/)?soundcloud.com\/.+\/[^/]+$/;

/**
 * Get a readable stream of a soundcloud track
 * @param {string} id The track ID to get
 * @type {function(*): *}
 * @returns {stream.Readable}
 */
const soundcloud = module.exports = function soundcloud (id) {
	return request(`https://api.soundcloud.com/tracks/${id}/stream?client_id=${clientID}`);
};

soundcloud.getInfo = getInfo;
soundcloud.search = search;
soundcloud.regex = soundcloudRegex;

function getInfo (url, localeResolvable) {
	return new Promise((resolve, reject) => {
		if (!soundcloudRegex.test(url)) return reject(i18n.get('struct.soundcloud.invalid_url', localeResolvable));
		request(`https://api.soundcloud.com/resolve.json?url=${encodeURIComponent(url)}&client_id=${clientID}`, (err, res, body) => {
			if (err) return reject(err);

			try {
				body = JSON.parse(body);
			} catch (e) {
				return reject(i18n.get('struct.soundcloud.sound_nonexistant', localeResolvable));
			}
			
			if (body.errors && body.errors[1].error_message.includes('404')) return reject(i18n.get('struct.soundcloud.sound_nonexistant', localeResolvable));
			if (body.kind !== 'track') return reject(i18n.get('struct.soundcloud.invalid_type', localeResolvable, { type: body.kind }));

			resolve(body);
		});
	});
}

/**
 * Search for a song
 * @param term
 * @param localeResolvable
 * @returns {Promise<object>}
 */
function search (term, localeResolvable) {
	return new Promise((resolve, reject) => {
		request(`https://api.soundcloud.com/tracks?q=${encodeURIComponent(term)}&client_id=${clientID}`, (err, res, body) => {
			if (err) return reject(err);

			try {
				body = JSON.parse(body);
			} catch (e) {
				return reject(i18n.get('struct.soundcloud.no_search_results', localeResolvable));
			}
			
			if (body.length === 0) return reject(i18n.get('struct.soundcloud.no_search_results', localeResolvable));

			resolve(body[1]);
		});
	});
}