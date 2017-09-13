const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('ytdl-core');
const search = require('youtube-search');
const fs = require('fs');

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

	let msg = await message.channel.send('Downloading...');

	let date = Date.now();

	let info = await ytdl.getInfo(id);
	if (info.livestream) {
		msg.edit('Ah right, you expect me to download a livestream. Just no, thanks.');
		return client.processing.splice(index, 1);
	}
	if (info.length_seconds > 600) {
		msg.edit('Anything bigger than 10 minutes is gonna be too big for me to send through Discord - Sorry!');
		return client.processing.splice(index, 1);
	}

	let ytdlStream = ytdl(id, { filter: 'audioonly' });

	let secObj = secSpread(info.length_seconds);

	msg.edit('Converting...');

	ffmpeg(ytdlStream)
		.duration(info.length_seconds + 1)
		.audioBitrate(128)
		.on('end', () => {
			msg.delete().catch();
			message.channel.send('', {
				embed: {
					description: `Song downloaded.\nOriginal video [here](https://youtu.be/${id})\n${secObj.h ? `${secObj.h}h ` : ''}${secObj.m ? `${secObj.m}m ` : ''}${secObj.s}s`,
					thumbnail: {
						url: info.iurlhq
					},
					color: 0x42f45c,
					footer: {
						text: `Requested by ${message.author.tag}`
					}
				},
				files: [{
					attachment: `../media/temp/${id}-${date}.mp3`,
					name: info.title + '.mp3'
				}]
			}).catch(() => {
				message.channel.send('The file was too big to send (anything longer than ~10 minutes is probably too long).. Sorry!');
			}).then(() => {
				fs.unlinkSync(`../media/temp/${id}-${date}.mp3`);
				client.processing.splice(index, 1);
			});
		})
		.save(`${__dirname}/../../../media/temp/${id}-${date}.mp3`);
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
	permLevel: 2,
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