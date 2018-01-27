const fs = require('fs');
const ytdl = require('ytdl-core');
const request = require('request');
const search = require('youtube-search');
const Music = require('../../struct/music.js');

let add = async (message, id, type, client, first) => {
	let title = first
		? 'Now Playing'
		: 'Added to Queue';

	let obj;

	try {
		obj = await Music.getInfo(type, id, message, client, title);
	} catch (err) {
		if (!message.guild.music.queue && message.guild.voiceConnection) message.guild.voiceConnection.disconnect();
		return message.channel.send(err);
	}

	let queueObj = { type: type, person: message.author, id: id, meta: obj.meta };
	if (obj.embed) message.channel.send({embed: obj.embed});

	if (first) {
		message.guild.music.queue = [ queueObj ];
		Music.next(message.guild, true);
	} else message.guild.music.queue.push(queueObj);
};

exports.run = async (message, args, suffix, client, perms) => {
	if (!message.member.voiceChannel) return message.channel.send('Hey man, I can\'t just play music through your speakers magically. Could you like.. connect to a voice channel?');
	if (!args[0] && !message.attachments.size) {
		if (message.guild.music && message.guild.music.playing === false) return client.commands.get('resume').run(message, 'yes', 'no', 'die', perms);
		return message.channel.send('What? Do you want me to just play some random song? You seriously think I\'d do that? No. Choose your song.');
	}

	/*
			types
		1 - YouTube
		2 - Uploaded File
		3 - Local File
		4 - File from URL

			soundcloud/discordfm in the future



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
			voteSkips: array (all people who have voted to skip)
	 */

	let object;

	try {
		object = await Music.parseMessage(message, args, suffix, client);
	} catch (err) {
		return message.channel.send(err);
	}

	let { id } = object;
	let { type } = object;

	if (!message.guild.music || !message.guild.music.queue) {
		if (!message.member.voiceChannel.joinable) return message.channel.send('I can\'t join the channel you\'re in.');

		message.guild.music = {};

		message.member.voiceChannel.join().then(connection => {
			message.guild.music.playing = true;

			add(message, id, type, client, true).catch(() => {
				message.guild.music = {};
				return message.channel.send('The video you were trying to play is unavailable in the US - sorry.');
			});

			connection.on('error', () => {
				message.guild.music = {};
				return message.channel.send('Connection to voice channel not established, please try again.');
			})
		}).catch(err => {
			message.channel.send('Connection not established - ' + err.name);
		});
	} else add (message, id, type, client, false).catch(() => {
		message.channel.send('The video you tried to add is unavailable in the US - sorry.');
	});
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
	usage: 'play <song name/youtube url/file url/file/top/liked> [extra params]',
	help: 'Play a song or add one to the queue. Only supports songs playable in the US.',
	category: 'Music'
};