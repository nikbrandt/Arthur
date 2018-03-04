const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('ytdl-core');
const search = require('youtube-search');
const fs = require('fs');
const request = require('request');

const YTRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([A-z0-9_-]{11})(&.*)?$/;

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
	client.processing.push(message.id + ' - MP3');

	let msg = await message.channel.send('Downloading..');

	let info = await ytdl.getInfo(id);
	if (info.livestream) {
		msg.edit('Ah right, you expect me to download a livestream. Just no, thanks.').catch();
		return client.processing.splice(index, 1);
	}

	if (info.length_seconds > 1200) {
		msg.edit('I\'ve set a limit of 20 minutes on songs; my CPU is limited and so is your time.').catch();
		return client.processing.splice(index, 1);
	}

	msg.edit('Downloading... This should take about **' + (info.length_seconds / 15).toFixed(0) + '** seconds to convert..').catch();
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
				fs.unlinkSync(`../media/temp/${title}.mp3`);
				client.processing.splice(index, 1);

				msg.delete().catch();

				message.channel.send(`${message.member.toString()}, your song is converted.`, {
					embed: {
						title: info.title,
						description: `Song is [here](${body}).\nOriginal video [here](https://youtu.be/${id}).\n${secObj.h ? `${secObj.h}h ` : ''}${secObj.m ? `${secObj.m}m ` : ''}${secObj.s}s`,
						thumbnail: {
							url: info.thumbnail_url
						},
						color: 0x42f45c,
						footer: {
							text: `Requested by ${message.author.tag} | File will be deleted after 48 hours`
						}
					}
				});
			});
		})
		.audioCodec('libmp3lame')
		.save(`${__dirname}/../../../media/temp/${title}.mp3`);
}

exports.run = async (message, args, suffix, client) => {
	if (!args[0]) return message.channel.send('I can\'t download nothing..');

	let id;

	if (!YTRegex.test(args[0])) {
		let sOpts = {
			maxResults: 1,
			key: client.config.ytkey,
			type: 'video'
		};

		search(suffix, sOpts, (err, results) => {
			if (err) return message.channel.send('The video you searched for does not exist.. rip');

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