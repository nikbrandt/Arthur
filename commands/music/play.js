const Music = require('../../struct/Music.js');
const config = require('../../../media/config.json');
const { errorLog } = require('../../functions/eventLoader.js');
const { objectMap, timeString } = require('../../struct/Util.js');
const { calculateQueueLength, calculateEllapsedTime } = require('../../struct/Music.js');

let add = async (message, id, type, client, first, loadMessage, ipc, playlistQuery) => {
	let title = first
		? i18n.get('struct.music.now_playing', message)
		: i18n.get('struct.music.added_to_queue', message);

	let playlist = type % 1 > .3; // playlists have a .5 added to the type; dividing by 1 will produce a remainder > .3 (not === .5 because binary math).

	let obj;

	try {
		obj = await Music.getInfo(type, id, message, client, title);
	} catch (err) {
		if (!message.guild.music.queue && message.guild.voice) message.guild.voice.connection.disconnect();
		if (err instanceof Error) err = message.__('error_getting_info', { err });
		return ipc ? err : loadMessage.edit(err);
	}

	let queueObj;

	if (playlist) {
		obj = objectMap(obj, (itemID, item) => {
			return { type: type - (type * 10 % 10 / 10), person: message.author, id: itemID, meta: item.meta, embed: item.embed };
		});

		queueObj = obj[0];
	} else queueObj = { type: type, person: message.author, id: id, meta: obj.meta, embed: obj.embed };

	let footerStore = queueObj.embed ? queueObj.embed.footer.text : null;
	if (!first && footerStore) queueObj.embed.footer.text += ' | ' + message.__('footer_extra', {
		position: message.playnext ? 2 : message.guild.music.queue.length + 1,
		time: message.playnext ? timeString(message.guild.music.queue[0].meta.length - calculateEllapsedTime(message.guild), message) : timeString(calculateQueueLength(message.guild), message)
	});

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
	else if (message.playnext) message.guild.music.queue.splice(1, 0, queueObj);
	else message.guild.music.queue.push(queueObj);

	if (playlistQuery) {
		if (message.channel.permissionsFor(message.guild.me).has('ADD_REACTIONS')) message.channel.send(message.__('detected_playlist')).then(async msg => {
			const filter = (reaction, user) => ([ '706749501842522112', '706749501947510805' ].includes(reaction.emoji.id) || [ '️️️️✔️', '✖️' ].includes(reaction.emoji.name)) && user.id === message.author.id;

			msg.awaitReactions(filter, { time: 1000 * 60, max: 1}).then(reactions => {
				if (!reactions || !reactions.size) return;
				if (reactions.first().emoji.id === '706749501947510805' || reactions.first().emoji.name === '✖️') return msg.edit(i18n.get('struct.message.confirmation', message));

				finishPlaylistQuery(client, message, ipc, type, playlistQuery);
			});

			msg.react('706749501842522112').catch(() => { // yes (check)
				msg.react('️️️️✔️').catch(() => {});
			}).then(() => {
				msg.react('706749501947510805').catch(() => { // no (x)
					msg.react('✖️').catch(() => {});
				});
			});
		});
		else {
			const playlistMessage = await message.channel.send(message.__('detected_playlist') + ' ' + i18n.get('booleans.yesno.prompt', message));
			
			let starts = [
				i18n.get('booleans.yesno.abbreviations.yes', message),
				i18n.get('booleans.yesno.abbreviations.no', message)
			];
			
			starts.push(starts[0] + i18n.get('booleans.yesno.abbreviations.yes_end', message));
			starts.push(starts[1] + i18n.get('booleans.yesno.abbreviations.no_end', message));
			
			const filter = msg => message.author.id === msg.author.id && starts.some(start => msg.content.toLowerCase().startsWith(start));
			
			message.channel.awaitMessages(filter, { max: 1, time: 1000 * 60, errors: [ 'time' ]}).then(collected => {
				if (!collected.first().content.toLowerCase().startsWith(starts[0])) return playlistMessage.edit(i18n.get('struct.message.confirmation', message));

				finishPlaylistQuery(client, message, ipc, type, playlistQuery);
			}).catch(() => {
				playlistMessage.delete().catch(() => {});
			});
		}
	}
	
	return 1; // for IPC
};

function finishPlaylistQuery(client, message, ipc, type, playlistQuery) {
	let playlistLink = type === 1
		? 'https://youtube.com/playlist?list=' + playlistQuery
		: 'https://soundcloud.com/' + playlistQuery;

	client.commands.get('play').run(message, [ playlistLink ], playlistLink, client, message.perms, message.prefix, ipc).catch(() => {});
}

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
		  1.5 - YouTube playlist (resolves to adding n of type 1 into queue)
		2 - Uploaded File (deprecated to type 4)
		3 - Local File (bot filesystem)
		4 - File from URL
		5 - SoundCloud
		  5.5 - SoundCloud playlist (resolves to adding n of type 5 into queue)

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
				length: song length, in seconds
			embed: embed message if applicable
			voteSkips: array (all people who have voted to skip)
		textChannel: channel in which last play message was
		startTime: time current song started (may be fudged from reality due to below)
		pauseTime: time current song paused, if paused (offsets startTime on resume to get accurate playing time)
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

	if (message.playnext && (type === 1.5 || type === 5.5)) return message.channel.send(message.__('playnext_playlist'));

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
	category: 'music'
};
