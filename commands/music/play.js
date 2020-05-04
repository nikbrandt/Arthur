const Music = require('../../struct/music.js');
const config = require('../../../media/config.json');
const { errorLog } = require('../../functions/eventLoader.js');
const { objectMap } = require('../../struct/Util.js');

let add = async (message, id, type, client, first, loadMessage, ipc, playlistQuery) => {
	let title = first
		? i18n.get('struct.music.now_playing', message)
		: i18n.get('struct.music.added_to_queue', message);

	let playlist = type % 1 > 0; // playlists have a .1 added to the type; dividing by 1 will produce a nonzero remainder.

	let obj;

	try {
		obj = await Music.getInfo(type, id, message, client, title);
	} catch (err) {
		if (!message.guild.music.queue && message.guild.voice) message.guild.voice.connection.disconnect();
		return ipc ? message.__('error_getting_info', { err }) : loadMessage.edit(message.__('error_getting_info', { err }));
	}

	let queueObj;

	if (playlist) {
		obj = objectMap(obj, (itemID, item) => {
			return { type: type - (type * 10 % 10 / 10), person: message.author, id: itemID, meta: item.meta, embed: item.embed };
		});

		queueObj = obj[0];
	} else queueObj = { type: type, person: message.author, id: id, meta: obj.meta, embed: obj.embed };

	let footerStore = queueObj.embed.footer.text;
	if (!first) queueObj.embed.footer.text += ' | ' + message.__('position_in_queue', {position: message.guild.music.queue.length + 1});

	if (queueObj.embed) {
		if (ipc) {
			let notify = await sql.get(`SELECT npNotify FROM guildOptions WHERE guildID = '${guild.id}'`);
			if (!notify) notify = false;
			else notify = notify.npNotify === 'true';
			
			if (notify) {
				if (first || !playlist) {
					loadMessage = await message.channel.send({embed: queueObj.embed}).then(() => {
						queueObj.embed.footer.text = footerStore;

					});
				}

				queueObj.embed.footer.text = footerStore;
				if (playlist) message.channel.send(i18n.get('struct.music.added_playlist', message, { num: obj.length }));
			} else queueObj.embed.footer.text = footerStore;
		} else if (first || !playlist) {
			loadMessage.edit(playlist ? i18n.get('struct.music.added_playlist', message, { num: obj.length }) : '', { embed: queueObj.embed }).then(() => {
				queueObj.embed.footer.text = footerStore;
			});
		} else {
			queueObj.embed.footer.text = footerStore;
			if (playlist) loadMessage.edit(i18n.get('struct.music.added_playlist', message, { num: obj.length }));
		}
	} else if (!ipc) loadMessage.delete();

	message.guild.music.textChannel = message.channel;

	if (first) {
		if (queueObj.embed && loadMessage) Music.addReactionCollector(loadMessage, client, queueObj.ms);
		if (playlist) message.guild.music.queue = obj;
		else message.guild.music.queue = [ queueObj ];
		Music.next(message.guild, true);
	} else if (playlist) message.guild.music.queue = message.guild.music.queue.concat(obj);
	else message.guild.music.queue.push(queueObj);

	if (playlistQuery) {
		message.channel.send(message.__('detected_playlist')).then(async msg => {
			const filter = (reaction, user) => [ '706749501842522112', '706749501947510805' ].includes(reaction.emoji.id) && user.id === message.author.id;

			msg.awaitReactions(filter, { time: 1000 * 60, max: 1}).then(reactions => {
				if (!reactions || !reactions.size) return;
				if (reactions.first().emoji.id === '706749501947510805') return msg.edit(i18n.get('struct.message.confirmation', message));

				let playlistLink = 'https://youtube.com/playlist?list=' + playlistQuery;

				client.commands.get('play').run(message, [ playlistLink ], playlistLink, client, message.perms, message.prefix, ipc).catch(() => {});
			});

			await msg.react('706749501842522112'); // yes (check)
			msg.react('706749501947510805'); // no (x)
		});
	}
	
	return 1; // for IPC
};

exports.run = async (message, args, suffix, client, perms, prefix, ipc) => {
	if (!message.member.voice.channel) return message.channel.send(message.__('not_in_channel'));
	if (!args[0] && !message.attachments.size) {
		if (message.guild.music && message.guild.music.playing === false) {
			message.__ = (string, variables) => {
				return i18n.get('commands.resume.' + string, message, variables);
			};
			
			return ipc ? 'No song provided to add' : client.commands.get('resume').run(message, 'yes', 'no', 'die', perms);
		}
		return ipc ? 'No song provided to add' : message.channel.send(message.__('no_song_specified'));
	}

	message.perms = perms;
	message.prefix = prefix;

	/*
			types
		1 - YouTube
		  1.1 - YouTube playlist (resolves to adding n of type 1 into queue)
		  1.2 - YouTube playlist from video (e.g. youtube.com/watch?v=asdf1234567&list=big_ole_playlist_id_here)
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
	let loadMessage = ipc ? undefined : await message.channel.send(config.musicLoadingEmojis[Math.floor(Math.random() * config.musicLoadingEmojis.length)]);

	try {
		object = await Music.parseMessage(message, args, suffix, client);
	} catch (err) {
		if (message.guild.voice && message.guild.voice.connection && (!message.guild.music || !message.guild.music.queue[0])) message.guild.voice.connection.disconnect().catch(() => {});
		return ipc ? err : loadMessage.edit(err.toString());
	}

	let { id, type, list } = object;

	if (message.guild.music && message.guild.music.queue) {
		try {
			return await add(message, id, type, client, false, loadMessage, ipc, list);
		} catch (e) {
			errorLog('Error during play command adding', e.stack, `ID ${id} | Type ${type}`);
			return ipc ? message.__('unavailable_in_us') : loadMessage.edit(message.__('unavailable_in_us'));
		}
	}

	if (!message.member.voice.channel.joinable) return ipc ? message.__('cant_join_channel') : loadMessage.edit(message.__('cant_join_channel'));

	message.guild.music = {};
	let stop = false;

	try {
		let errorInterval = setInterval(() => {
			if (message.guild.voice && message.guild.voice.connection) {
				clearInterval(errorInterval);
				message.guild.voice.connection.on('error', err => {
					if (!ipc) loadMessage.edit(message.__('could_not_connect', { err }));
					stop = true;
				});
			}
		}, 500);
		
		await message.member.voice.channel.join();
	} catch (e) {
		return loadMessage.edit(message.__('could_not_connect', { err: e.stack ? e.stack.split('\n')[0] : e }));
	}
	
	if (stop) return message.__('could_not_connect');

	message.guild.music.playing = true;

	try {
		return await add(message, id, type, client, true, loadMessage, ipc, list);
	} catch(e) {
		message.guild.music = {};
		return ipc ? e : loadMessage.edit(message.__('unavailable_in_us'));
	}
};

exports.config = {
	enabled: 'true',
	permLevel: 2,
	perms: [ 'EMBED_LINKS', 'SPEAK', 'CONNECT' ],
	guildCooldown: 1000,
	category: 'music'
};
