const fs = require('fs');
const request = require('request');
const ytdl = require('ytdl-core');
const search = require('youtube-search');
const music = require('../../struct/music.js');

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

let add = async (message, id, type) => {
	if (type === 1) {
		let info = await ytdl.getInfo(id);
		let secObj = secSpread(info.length_seconds);

		message.channel.send({embed: {
			author: {
				name: 'Added to queue',
				icon_url: info.author.avatar
			},
			color: 0x427df4,
			description: `[${info.title}](https://youtu.be/${id})\nBy [${info.author.name}](${info.author.channel_url})\nLength: ${secObj.h ? `${secObj.h}h ` : ''}${secObj.m ? `${secObj.m}m ` : ''}${secObj.s}s`,
			thumbnail: {
				url: info.iurlhq
			},
			footer: {
				text: `Requested by ${message.author.tag}`
			}
		}});
	} else if (type === 2) {
		message.channel.send({
			embed: {
				title: 'Added to queue',
				color: 0x427df4,
				description: 'Your file has been added to the queue.',
				footer: {
					text: `Requested by ${message.author.tag}`
				}
			}
		});
	}

	message.guild.music.queue.push({ type: type, person: message.author, id: id });
};

exports.run = (message, args, suffix, client) => {
	if (!message.member.voiceChannel) return message.channel.send('You\'ve got to be in a voice channel to play music.');
	if (!args[0] && !message.attachments.size) return message.channel.send('You have to tell me what to play.');

	let id;
	let type = 1;

	/*
		1 - YouTube
		2 - File

			in the future, 3 for soundcloud
	 */

	if (!YTRegex.test(args[0]) && !message.attachments.size) {
		let sOpts = {
			maxResults: 1,
			key: client.config.ytkey,
			type: 'video'
		};

		search(suffix, sOpts, (err, results) => {
			if (err || !results[0]) return message.channel.send('The video you searched for does not exist.. rip');

			id = results[0].id;

			if (message.guild.music && message.guild.music.queue) add(message, id, 1).catch(console.error);
		});
	} else if (message.attachments.size) {
		type = 2;
		id = message.attachments.first().url;

		if (!id.endsWith('.mp3')) return message.channel.send('I only support playback of mp3\'s right now.');

		if (message.guild.music && message.guild.music.queue) add(message, id, 2).catch(console.error);
	} else {
		id = args[0].match(YTRegex)[4];

		if (message.guild.music && message.guild.music.queue) add(message, id, 1).catch(console.error);
	}

	/*
	music contains:
		playing: bool
		channel: Discord.VoiceChannel
		queue: array of objects:
			type: number (see type explanation in above comment)
			person: string (requester object)
			id: string (youtube video id or file url)
	 */

	if (!message.guild.music || !message.guild.music.queue) {
		if (!message.member.voiceChannel.joinable) return message.channel.send('I can\'t join the channel you\'re in.');

		message.guild.music = {};
		message.guild.music.channel = message.member.voiceChannel;

		message.member.voiceChannel.join().then(async () => {
			message.guild.music.playing = true;
			message.guild.music.queue = [{type: type, person: message.author, id: id}];

			if (type === 1) { // youtube video
				let info = await ytdl.getInfo(id);
				let secObj = secSpread(info.length_seconds);

				message.channel.send({
					embed: {
						author: {
							name: 'Now Playing',
							icon_url: info.author.avatar
						},
						color: 0x427df4,
						description: `[${info.title}](https://youtu.be/${id})\nBy [${info.author.name}](${info.author.channel_url})\nLength: ${secObj.h ? `${secObj.h}h ` : ''}${secObj.m ? `${secObj.m}m ` : ''}${secObj.s}s`,
						thumbnail: {
							url: info.iurlhq
						},
						footer: {
							text: `Requested by ${message.author.tag}`
						}
					}
				});

				music.next(message.guild, true)
			} else if (type === 2) { // file url
				message.channel.send({
					embed: {
						author: {
							name: 'Now Playing'
						},
						color: 0x427df4,
						description: `A file provided by ${message.author.tag}`
					}
				});

				music.next(message.guild, true);
			}
		})
	}
};

exports.config = {
	enabled: 'true',
	permLevel: 2,
	aliases: [],
	perms: ['EMBED_LINKS', 'SPEAK', 'CONNECT'],
	cooldown: 5000
};

exports.help = {
	name: 'Play',
	description: 'Play a song or add it to the queue',
	usage: 'play <song name or url>',
	help: 'Play a song or add one to the queue. Only supports youtube right now.',
	category: 'Music'
};