const request = require('request');
const fetch = require('node-fetch');

const config = require('../../media/config.json');
const clientID = config.soundcloudID;

const soundcloudRegex = /^(https:\/\/)?soundcloud.com\/.+\/[^/]+$/;

let cache = new Map();

const soundcloud = module.exports = function soundcloud (id) {
	return new Promise(resolve => {
		fetch(id + `?client_id=${clientID}`)
			.then(res => res.json())
			.then(json => resolve(json.url));
	});
};

soundcloud.getInfo = getInfo;
soundcloud.search = search;
soundcloud.regex = soundcloudRegex;

function getInfo (url, localeResolvable) {
	return new Promise((resolve, reject) => {
		if (!soundcloudRegex.test(url)) return reject(i18n.get('struct.soundcloud.invalid_url', localeResolvable));
		if (url.indexOf('?') > 0) url = url.substring(0, url.indexOf('?'));
		
		if (cache.has(url)) return resolve(cache.get(url));
		
		request(`https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(url)}&client_id=${clientID}`, (err, res, body) => {
			if (err) return reject(err);

			try {
				body = JSON.parse(body);
			} catch (e) {
				return reject(i18n.get('struct.soundcloud.sound_nonexistant', localeResolvable));
			}
			
			if (body.errors && body.errors[1].error_message.includes('404')) return reject(i18n.get('struct.soundcloud.sound_nonexistant', localeResolvable));
			if (body.kind !== 'track') return reject(i18n.get('struct.soundcloud.invalid_type', localeResolvable, { type: body.kind }));

			addToCache(body);
			body.id = body.media.transcodings[1].url;
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
		request(`https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(term)}&limit=1&client_id=${clientID}`, (err, res, body) => {
			if (err) return reject(err);

			try {
				body = JSON.parse(body);
			} catch (e) {
				return reject(i18n.get('struct.soundcloud.no_search_results', localeResolvable));
			}
			
			if (!body.collection || body.collection.length === 0) return reject(i18n.get('struct.soundcloud.no_search_results', localeResolvable));

			addToCache(body.collection[0]);
			resolve(body.collection[0]);
		});
	});
}

function addToCache(song) {
	cache.set(song.permalink_url, {
		duration: song.duration,
		title: song.title,
		user: {
			username: song.user.username,
			avatar_url: song.user.avatar_url
		},
		id: song.media.transcodings[1].url,
		artwork_url: song.artwork_url
	});
	
	setTimeout(() => {
		cache.delete(song.permalink_url);
	}, 1000 * 60 * 15);
}