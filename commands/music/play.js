const Music = require('../../struct/music.js');
const config = require('../../../media/config.json');

let add = async (message, id, type, client, first, loadMessage) => {
	let title = first
		? i18n.get('struct.music.now_playing', message)
		: i18n.get('struct.music.added_to_queue', message);

	let obj;

	try {
		obj = await Music.getInfo(type, id, message, client, title);
	} catch (err) {
		if (!message.guild.music.queue && message.guild.voiceConnection) message.guild.voiceConnection.disconnect();
		return loadMessage.edit(message.__('error_getting_info', { err }));
	}

	let queueObj = { type: type, person: message.author, id: id, meta: obj.meta, embed: obj.embed };
	if (obj.embed) loadMessage.edit('', {embed: obj.embed});
	else loadMessage.delete();

	message.guild.music.textChannel = message.channel;

	if (first) {
		if (obj.embed) Music.addReactionCollector(loadMessage, client, obj.ms);
		message.guild.music.queue = [ queueObj ];
		Music.next(message.guild, true);
	} else message.guild.music.queue.push(queueObj);
};

exports.run = async (message, args, suffix, client, perms) => {
	if (!message.member.voiceChannel) return message.channel.send(message.__('not_in_channel'));
	if (!args[0] && !message.attachments.size) {
		if (message.guild.music && message.guild.music.playing === false) {
			message.__ = (string, variables) => {
				return i18n.get('commands.resume.' + string, message, variables);
			};
			
			return client.commands.get('resume').run(message, 'yes', 'no', 'die', perms);
		}
		return message.channel.send(message.__('no_song_specified'));
	}

	/*
			types
		1 - YouTube
		2 - Uploaded File (deprecated to type 4)
		3 - Local File (bot filesystem)
		4 - File from URL
		5 - SoundCloud

			discordfm in the future


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
			embed: embed message if applicable
			voteSkips: array (all people who have voted to skip)
		textChannel: channel in which last play message was
	 */

	let object;
	let loadMessage = await message.channel.send(config.musicLoadingEmojis[Math.floor(Math.random() * config.musicLoadingEmojis.length)]);

	try {
		object = await Music.parseMessage(message, args, suffix, client);
	} catch (err) {
		if (message.guild.voiceConnection && !message.guild.music && !message.guild.music.queue[0]) message.guild.voiceConnection.disconnect().catch(() => {});
		return loadMessage.edit(err);
	}

	let { id } = object;
	let { type } = object;

	if (!message.guild.music || !message.guild.music.queue) {
		if (!message.member.voiceChannel.joinable) return loadMessage.edit(message.__('cant_join_channel'));

		message.guild.music = {};
		let stop = false;

		try {
			let errorInterval = setInterval(() => {
				if (message.guild.voiceConnection) {
					clearInterval(errorInterval);
					message.guild.voiceConnection.on('error', err => {
						loadMessage.edit(message.__('could_not_connect', { err }));
						stop = true;
					});
				}
			}, 500);
			
			await message.member.voiceChannel.join();
		} catch (e) {
			return loadMessage.edit(message.__('could_not_connect', { err: e.stack ? e.stack.split('\n')[0] : e }));
		}
		
		if (stop) return;

		message.guild.music.playing = true;

		add(message, id, type, client, true, loadMessage).catch(() => {
			message.guild.music = {};
			return loadMessage.edit(message.__('unavailable_in_us'));
		});
	} else add (message, id, type, client, false, loadMessage).catch(() => {
		loadMessage.edit(message.__('unavailable_in_us'));
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
	usage: 'play <song name/youtube or soundcloud url/file url/file/top/liked> [extra params]',
	help: 'Play a song or add one to the queue. Only supports songs playable in the US.',
	category: 'Music'
};
