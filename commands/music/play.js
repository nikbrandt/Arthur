const fs = require('fs');
const ytdl = require('ytdl-core');
const request = require('request');
const search = require('youtube-search');
const Music = require('../../struct/music.js');

const songRegex = /\/([^/]+)\.(mp3|ogg)$/;
const discordRegex = /.*\/\/.*\/.*\/(.*)\.(mp3|ogg)/;

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

let add = async (message, id, type, client, first) => {
	let queueObj;
	let title = first
		? 'Now Playing'
		: 'Added to Queue';

	if (type === 1) {
		let info = await ytdl.getInfo(id);

		if (info.livestream === '1' || info.live_playback === '1' || (info.length_seconds > 1800 && !client.dbotsUpvotes.includes(message.author.id))) return message.channel.send(info.length_seconds > 4200 ? 'Hey there my dude that\'s a bit much, I don\'t wanna play a song longer than 30 minutes for ya...\nUnless you go [upvote me](https://discordbots.org/bot/329085343800229889).. *shameless self promotion* (upvotes can take up to 10 minutes to register, be patient)' : 'Trying to play a livestream, eh? I can\'t do that, sorry.. ;-;');

		let secObj = secSpread(info.length_seconds);

		message.channel.send({embed: {
			author: {
				name: title,
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

		queueObj = { type: type, person: message.author, id: id, meta: { url: `https://youtu.be/${id}`, title: `${info.title} (${secObj.h ? `${secObj.h}h ` : ''}${secObj.m ? `${secObj.m}m ` : ''}${secObj.s}s)`, queueName: `[${info.title}](https://youtu.be/${id}) - ${secObj.h ? `${secObj.h}h ` : ''}${secObj.m ? `${secObj.m}m ` : ''}${secObj.s}s` } };
	} else if (type === 2) {
		let filename = id.match(discordRegex)[1];

		message.channel.send({
			embed: {
				title: title,
				color: 0x427df4,
				description: `[${filename}](${id}) has been added to the queue.\n*If mp3/ogg file is fake, it will simply be skipped*`,
				footer: {
					text: `Requested by ${message.author.tag}`
				}
			}
		});

		queueObj = { type: type, person: message.author, id: id, meta: { title: filename, queueName: `[${filename}](${id})`, url: id } };
	} else if (type === 3) {
		queueObj = { type: type, person: message.author, id: id, meta: { title: id, queueName: id, url: 'https://github.com/Gymnophoria/Arthur'}};
	} else if (type === 4) {
		let filename = id.match(songRegex)[1];

		message.channel.send({
			embed: {
				title: title,
				color: 0x427df4,
				description: `[${filename}](${id})`,
				footer: {
					text: `Added by ${message.author.tag}`
				}
			}
		});

		queueObj = { type: type, person: message.author, id: id, meta: { title: filename, queueName: `[${filename}](${id})`, url: id } };
	}

	if (first) {
		message.guild.music.queue = [ queueObj ];
		Music.next(message.guild, true);
	} else message.guild.music.queue.push(queueObj);
};

exports.run = async (message, args, suffix, client) => {
	if (!message.member.voiceChannel) return message.channel.send('Hey man, I can\'t just play music through your speakers magically. Could you like.. connect to a voice channel?');
	if (!args[0] && !message.attachments.size) return message.channel.send('What? Do you want me to just play some random song? You seriously think I\'d do that? No. Choose your song.');

	/*
			types
		1 - YouTube
		2 - Uploaded File
		3 - Local File
		4 - File from URL

			soundcloud/discordfm in the future
	 */

	/*
	music contains:
		playing: bool
		channel: Discord.VoiceChannel
		queue: array of objects:
			type: number (see type explanation in above comment)
			person: string (requester object)
			id: string (youtube video id or file url)
			meta: object:
				title: title to display as queue title
				queueName: title to display in queue when not title
				url: url to display w/ title
	 */

	let object;

	try {
		object = await Music.parseMessage(message, args, suffix, client);
	} catch (err) {
		return message.channel.send(err);
	}

	if (!object || !object.id) return;

	let { id } = object;
	let { type } = object;

	if (!message.guild.music || !message.guild.music.queue) {
		if (!message.member.voiceChannel.joinable) return message.channel.send('I can\'t join the channel you\'re in.');

		message.guild.music = {};
		message.guild.music.channel = message.member.voiceChannel;

		message.member.voiceChannel.join().then(async () => {
			message.guild.music.playing = true;

			add(message, id, type, client, true).catch(console.error);
		})
	} else add (message, id, type, client, false).catch(console.error);
};

exports.config = {
	enabled: 'true',
	permLevel: 2,
	aliases: [],
	perms: ['EMBED_LINKS', 'SPEAK', 'CONNECT'],
	guildCooldown: 1000
};

exports.help = {
	name: 'Play',
	description: 'Play a song or add it to the queue',
	usage: 'play <song name or url>',
	help: 'Play a song or add one to the queue. Only supports youtube right now.',
	category: 'Music'
};