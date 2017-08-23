const ytdl = require('ytdl-core');
const search = require('youtube-search');
const music = require('../../struct/music.js');

const YTRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/([A-z0-9_-]{11})$/;

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

let add = async (message, id) => {
	let info = await ytdl.getInfo(id);
	let secObj = secSpread(info.length_seconds);

	message.channel.send({embed: {
		author: {
			name: 'Added to queue',
			icon_url: info.author.avatar
		},
		color: 0x427df4,
		description: `[${info.title}](https://www.youtu.be/${id})\nBy [${info.author.name}](${info.author.channel_url})\nLength: ${secObj.h ? `${secObj.h}h ` : ''}${secObj.m ? `${secObj.m}m ` : ''}${secObj.s}s`,
		thumbnail: {
			url: info.iurlhq
		},
		footer: {
			text: `Requested by ${message.author.tag}`
		}
	}});

	message.guild.music.queue.push({ person: message.author, id: id });
};

exports.run = (message, args, suffix, client) => {
	if (!message.member.voiceChannel) return message.channel.send('You\'ve got to be in a voice channel to play music.');

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

			if (message.guild.music && message.guild.music.queue) add(message, id).catch(console.error);
		});
	} else id = args[0].match(YTRegex)[4];

	/*
	music contains:
		playing: bool
		channel: Discord.VoiceChannel
		queue: array of objects:
			person: string (requester object)
			id: string (youtube video id)
	 */

	if (!message.guild.music || !message.guild.music.queue) {
		if (!message.member.voiceChannel.joinable) return message.channel.send('I can\'t join the channel you\'re in.');

		message.guild.music = {};
		message.guild.music.channel = message.member.voiceChannel;

		message.member.voiceChannel.join().then(async connection => {
			message.guild.music.playing = true;
			message.guild.music.queue = [{person: message.author, id: id}];

			let info = await ytdl.getInfo(id);
			let secObj = secSpread(info.length_seconds);

			message.channel.send({
				embed: {
					author: {
						name: 'Now Playing',
						icon_url: info.author.avatar
					},
					color: 0x427df4,
					description: `[${info.title}](https://www.youtu.be/${id})\nBy [${info.author.name}](${info.author.channel_url})\nLength: ${secObj.h ? `${secObj.h}h ` : ''}${secObj.m ? `${secObj.m}m ` : ''}${secObj.s}s`,
					thumbnail: {
						url: info.iurlhq
					},
					footer: {
						text: `Requested by ${message.author.tag}`
					}
				}
			});

			const stream = ytdl(id, {filter: 'audioonly'});
			const dispatcher = connection.playStream(stream);
			dispatcher.on('end', () => {
				music.next(message.guild);
			})
		})
	}
};

exports.config = {
	enabled: 'true',
	permLevel: 10, // change this when out of beta :p
	aliases: []
};

exports.help = {
	name: 'Play',
	description: 'Play a song or add it to the queue',
	usage: 'play <song name or url>',
	help: 'Play a song or add one to the queue. Only supports youtube right now.',
	category: 'Music'
};