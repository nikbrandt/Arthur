const needle = require('needle');
const Discord = require('discord.js');

const { timeString } = require('./Util.js');
const config = require('../../media/config.json');
const clientID = config.soundcloudID;

const soundcloudRegex = /^(https:\/\/)?soundcloud.com\/.+\/[^/\n\s]+$/;

let cache = new Map();
let timeouts = {};

const soundcloud = module.exports = function soundcloud (id) {
	return new Promise(async resolve => {
		let res = await needle('get', id + `?client_id=${clientID}`, { json: true });
		return resolve(res.body.url);
	});
};

soundcloud.getInfo = getInfo;
soundcloud.search = search;
soundcloud.constructInfoFromMeta = constructInfoFromMeta;
soundcloud.regex = soundcloudRegex;

function getInfo (url, localeResolvable) {
	return new Promise(async (resolve, reject) => {
		if (!soundcloudRegex.test(url)) return reject(i18n.get('struct.soundcloud.invalid_url', localeResolvable));
		if (url.indexOf('?') > 0) url = url.substring(0, url.indexOf('?'));
		
		if (cache.has(url)) return resolve(cache.get(url));
		
		let { body } = await needle('get', `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(url)}&client_id=${clientID}`, { json: true }).catch(err => {
			reject(err);
		});
		
		if (!body) return;
			
		if (body.errors && body.errors[1].error_message.includes('404')) return reject(i18n.get('struct.soundcloud.sound_nonexistant', localeResolvable));
		if (body.kind !== 'track' && body.kind !== 'playlist') return reject(i18n.get('struct.soundcloud.invalid_type', localeResolvable, { type: body.kind }));

		addToCache(body);
		if (body.kind === 'track') body.id = body.media.transcodings[1].url;
		resolve(body);
	});
}

/**
 * Search for a song
 * @param term
 * @param localeResolvable
 * @returns {Promise<object>}
 */
function search (term, localeResolvable) {
	return new Promise(async (resolve, reject) => {
		let { body } = await needle('get', `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(term)}&limit=1&client_id=${clientID}`, { json: true }).catch(err => {
			reject(err);
		});

		if (!body) return reject(i18n.get('struct.soundcloud.no_search_results', localeResolvable));
			
		if (!body.collection || body.collection.length === 0) return reject(i18n.get('struct.soundcloud.no_search_results', localeResolvable));

		addToCache(body.collection[0]);
		resolve(body.collection[0]);
	});
}

/**
 * Converts track meta from soundcloud API to getInfo friendly format
 * @param {object} meta Track meta from soundcloud API
 * @param {Message} message Message that started the getInfo request
 * @param {string} title The title being used in the embed of the song ("Now Playing" or "Added to queue", i18n'd)
 * @returns {object} Object with in getInfo format
 */
function constructInfoFromMeta(meta, message, title) {
	if (meta._arthur) return meta;

	let time = timeString(Math.round(meta.duration / 1000), message);

	meta.title = Discord.Util.escapeMarkdown(meta.title);
	meta.user.username = Discord.Util.escapeMarkdown(meta.user.username);

	return {
		_arthur: true,
		meta: {
			url: meta.permalink_url,
			title: `${meta.title} (${time})`,
			queueName: `[${meta.title}](${meta.permalink_url}) - ${time}`,
			id: meta.media.transcodings[1].url,
			length: Math.round(meta.duration / 1000)
		},
		embed: {
			author: {
				name: title,
				icon_url: meta.user.avatar_url
			},
			color: 0xff8800,
			description: `[${meta.title}](${meta.permalink_url})\n${i18n.get('commands.nowplaying.by', message)} [${meta.user.username}](${meta.user.permalink_url})\n${message._('length')}: ${time}`,
			thumbnail: {
				url: meta.artwork_url
			},
			footer: {
				text: i18n.get('commands.nowplaying.footer', message, {tag: message.author.tag})
			}
		},
		ms: meta.duration
	};
}

function addToCache(item) {
	let id = item.permalink_url;

	if (item.kind === 'track') cache.set(id, getNecessarySongInfo(item));
	else if (item.kind === 'playlist') {
		let tracks = [];
		item.tracks.forEach(track => {
			let id = track.permalink_url;
			let info = getNecessarySongInfo(track);

			cache.set(id, info);
			setCacheTimeout(id);
			tracks.push(info);
		});

		cache.set(id, {
			permalink_url: id,
			kind: 'playlist',
			tracks: tracks
		});
	}

	setCacheTimeout(id);
}

function getNecessarySongInfo(song) {
	return {
		duration: song.duration,
		title: song.title,
		user: {
			username: song.user.username,
			avatar_url: song.user.avatar_url,
			permalink_url: song.user.permalink_url
		},
		id: song.media.transcodings[1].url,
		artwork_url: song.artwork_url,
		kind: 'track'
	}
}

function setCacheTimeout(id) {
	if (timeouts[id]) clearTimeout(timeouts[id]);
	timeouts[id] = setTimeout(() => {
		cache.delete(id);
		delete timeouts[id];
	}, 1000 * 60 * 15);
}