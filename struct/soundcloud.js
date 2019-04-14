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

function getInfo (url) {
	return new Promise((resolve, reject) => {
		if (!soundcloudRegex.test(url)) return reject('Invalid URL');
		request(`https://api.soundcloud.com/resolve.json?url=${encodeURIComponent(url)}&client_id=${clientID}`, (err, res, body) => {
			if (err) return reject(err);

			try {
				body = JSON.parse(body);
			} catch (e) {
				return reject('Sound does not exist.');
			}
			
			if (body.errors && body.errors[1].error_message.includes('404')) return reject('Sound does not exist.');
			if (body.kind !== 'track') return reject('URL is not a sound file, rather a ' + body.kind + '.');

			resolve(body);
		});
	});
}

/**
 * Search for a song
 * @param term
 * @returns {Promise<object>}
 */
function search (term) {
	return new Promise((resolve, reject) => {
		request(`https://api.soundcloud.com/tracks?q=${encodeURIComponent(term)}&client_id=${clientID}`, (err, res, body) => {
			if (err) return reject(err);

			try {
				body = JSON.parse(body);
			} catch (e) {
				return reject('I could not find any songs by that name.');
			}
			
			if (body.length === 0) return reject('I could not find any songs by that name.');

			resolve(body[1]);
		});
	});
}