const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('ytdl-core');
const search = require('youtube-search');
const moment = require('moment');
const fs = require('fs');
const request = require('request');

const YTRegex = /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/v\/|youtube\.com\/embed\/)([A-z0-9_-]{11})(&.*)?$/;

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

async function finish(id, message, client) {
	let index = client.processing.length;
	client.processing.push(moment().format('h:mm:ss A') + ' - MP3');

	let msg = await message.channel.send(message.__('downloading'));

	let info = await ytdl.getInfo(id);
	if (info.livestream) {
		msg.edit(message.__('livestream')).catch(() => {});
		return client.processing.splice(index, 1);
	}

	if (info.length_seconds > 1200) {
		msg.edit(message.__('too_long', { minutes: 20 })).catch(() => {});
		return client.processing.splice(index, 1);
	}

	msg.edit(message.__('downloading_with_time', { seconds: (info.length_seconds / 15).toFixed(0) })).catch(() => {});
	let title = info.title.replace(/[^A-z0-9]/g, '_');

	let ytdlStream = ytdl(id, { quality: 'highestaudio' });

	let secObj = secSpread(info.length_seconds);

	ffmpeg(ytdlStream, {priority: 20})
		.duration(info.length_seconds + 1)
		.audioBitrate(128)
		.on('end', () => {
			const options = {
				url: 'https://uguu.se/api.php?d=upload-tool',
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

				message.channel.send(message.__('song_converted', { user: message.author.toString() }), {
					embed: {
						title: info.title,
						description: message.__('description', { url: body, id, length: `${secObj.h ? `${secObj.h}${i18n.get('time.abbreviations.hours', message)} ` : ''}${secObj.m ? `${secObj.m}${i18n.get('time.abbreviations.minutes', message)} ` : ''}${secObj.s}${i18n.get('time.abbreviations.seconds', message)}` }),
						thumbnail: {
							url: info.thumbnail_url
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
			
			message.channel.send(message.__('error', { err }));
		});
}

exports.run = async (message, args, suffix, client) => {
	if (!args[0]) return message.channel.send(message.__('no_args'));

	let id;

	if (!YTRegex.test(args[0])) {
		let sOpts = {
			maxResults: 1,
			key: client.config.ytkey,
			type: 'video'
		};

		search(suffix, sOpts, (err, results) => {
			if (err) return message.channel.send(message.__('no_results'));

			id = results[0].id;
			finish(id, message, client).catch(console.error);
		});
	} else {
		id = args[0].match(YTRegex)[4];
		finish(id, message, client).catch(console.error);
	}
};

exports.config = {
	enabled: true,
	permLevel: 1,
	aliases: [],
	perms: ['EMBED_LINKS', 'ATTACH_FILES'],
	cooldown: 10000
};

exports.help = {
	name: 'Mp3',
	description: 'Get an mp3 file of a YouTube video',
	usage: 'mp3 <search term or url>',
	help: 'Get an mp3 file of a YouTube video\'s audio.',
	category: 'Other'
};
