const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('ytdl-core');
const search = require('youtube-search');
const moment = require('moment');
const fs = require('fs');
const request = require('request');
const soundcloud = require('../../struct/soundcloud');

const YTRegex = /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/v\/|youtube\.com\/embed\/)([A-z0-9_-]{11})([&?].*)?$/;

function secSpread(sec) {
	let hours = Math.floor(sec / 3600);
	let mins = Math.floor((sec - hours * 3600) / 60);
	let secs = sec - (hours * 3600 + mins * 60);
	return {
		h: hours,
		m: mins,
		s: secs
	}
}

async function youtube(id, message, client) {
	let info;
	
	try {
		info = await ytdl.getInfo(id);
	} catch (e) {
		return message.edit(message.__('song_not_found')).catch(() => {});
	}
	
	if (!info) return message.edit(message.__('song_not_found')).catch(() => {});

	if (info.livestream) return message.edit(message.__('livestream')).catch(() => {});
	if (info.length_seconds > 1200) return message.edit(message.__('too_long', { minutes: 20 })).catch(() => {});

	message.edit(message.__('downloading_with_time', { seconds: Math.round((info.length_seconds / 24).toFixed(1)) * 10 })).catch(() => {});
	let title = info.title;

	let ytdlStream;

	try {
		ytdlStream = ytdl.downloadFromInfo(info, { quality: 'highestaudio' });
	} catch (e) {
		client.errorLog('Error retrieving ytdl stream in mp3', e.stack, e.code);
		return message.edit(message.__('song_not_found')).catch(() => {});
	}

	finish(ytdlStream, title, info.length_seconds, message, client, info.thumbnail_url, `https://youtu.be/${id}`).catch((e) => {
		client.errorLog('Error finishing mp3 from YT source', e.stack, e.code);
		return message.edit(message.__('song_not_found')).catch(() => {});
	});
}

async function finish(stream, title, length, message, client, thumbnail, url) {
	title = title.replace(/[^A-z0-9]/g, '_');

	let index = client.processing.length;
	client.processing.push(moment().format('h:mm:ss A') + ' - MP3');

	let msg = await message.channel.send(message.__('downloading'));

	let secObj = secSpread(length);

	ffmpeg(stream, {priority: 20})
		.duration(length + 1)
		.audioBitrate(128)
		.on('end', () => {
			const options = {
				url: 'https://file.io',
				method: 'POST',
				headers: {
					'User-Agent': 'Arthur Discord Bot (github.com/Gymnophoria/Arthur)'
				},
				formData: {
					"file": fs.createReadStream(`../media/temp/${title}.mp3`),
					"name": title + '.mp3'
				}
			};

			request(options, (err, res, body) => {
				let filePath = `../media/temp/${title}.mp3`;
				if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
				client.processing.splice(index, 1);

				msg.delete().catch(() => {});

				try {
					body = JSON.parse(body);
				} catch (e) {
					client.errorLog('Error parsing upload API body in mp3', e.stack, e.code);
					return message.channel.send(message.__('error', { err: e }));
				}

				if (err) message.channel.send(message.__('error', { err }));

				message.channel.send(message.__('song_converted', { user: message.author.toString() }), {
					embed: {
						title: title,
						description: message.__('description', { url: body.link, songURL: url, length: `${secObj.h ? `${secObj.h}${i18n.get('time.abbreviations.hours', message)} ` : ''}${secObj.m ? `${secObj.m}${i18n.get('time.abbreviations.minutes', message)} ` : ''}${secObj.s}${i18n.get('time.abbreviations.seconds', message)}` }),
						thumbnail: {
							url: thumbnail
						},
						color: 0x42f45c,
						footer: {
							text: message.__('footer', { tag: message.author.tag })
						}
					}
				});
			});
		})
		.audioCodec('libmp3lame')
		.save(`${__dirname}/../../../media/temp/${title}.mp3`)
		.on('error', err => {
			let filePath = `../media/temp/${title}.mp3`;
			if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
			client.processing.splice(index, 1);

			msg.delete().catch(() => {});

			client.errorLog('Error converting to mp3', err.stack, err.code);
			message.channel.send(message.__('error', { err }));
		});
}

exports.run = async (message, args, suffix, client) => {
	if (!args[0]) return message.channel.send(message.__('no_args'));

	let id;

	if (soundcloud.regex.test(args[0])) {
		let info;

		try {
			info = await soundcloud.getInfo(args[0]);
		} catch (e) {
			return message.edit(message.__('song_not_found')).catch(() => {});
		}

		let stream = soundcloud(info.id);
		let title = info.title;
		let length = Math.round(info.duration / 1000);
		let thumbnail = info.artwork_url;

		finish(stream, title, length, message, client, thumbnail, args[0]).catch(console.error);
	} else if (!YTRegex.test(args[0])) {
		let sOpts = {
			maxResults: 1,
			key: client.config.ytkey,
			type: 'video'
		};

		search(suffix, sOpts, (err, results) => {
			if (err) return message.channel.send(message.__('no_results'));

			id = results[0].id;
			youtube(id, message, client).catch(console.error);
		});
	} else {
		id = args[0].match(YTRegex)[4];
		youtube(id, message, client).catch(console.error);
	}
};

exports.config = {
	enabled: true,
	permLevel: 1,
	perms: ['EMBED_LINKS', 'ATTACH_FILES'],
	cooldown: 10000,
	category: 'other'
};
