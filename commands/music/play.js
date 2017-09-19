const fs = require('fs');
const sql = require('sqlite');
const request = require('request');
const ytdl = require('ytdl-core');
const search = require('youtube-search');
const Music = require('../../struct/music.js');

const YTRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([A-z0-9_-]{11})(&.*)?$/;
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

let add = async (message, id, type, client) => {
	if (type === 1) {
		let info = await ytdl.getInfo(id);

		if (info.livestream === '1' || info.live_playback === '1' || (info.length_seconds > 1800 && !client.dbotsUpvotes.includes(message.author.id))) return message.channel.send(info.length_seconds > 4200 ? 'Hey there my dude that\'s a bit much, I don\'t wanna play a song longer than 30 minutes for ya...\nUnless you go [upvote me](https://discordbots.org/bot/329085343800229889).. *shameless self promotion* (upvotes can take up to 10 minutes to register, be patient)' : 'Trying to play a livestream, eh? I can\'t do that, sorry.. ;-;');

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

		message.guild.music.queue.push({ type: type, person: message.author, id: id, meta: { url: `https://youtu.be/${id}`, title: `${info.title} (${secObj.h ? `${secObj.h}h ` : ''}${secObj.m ? `${secObj.m}m ` : ''}${secObj.s}s)`, queueName: `[${info.title}](https://youtu.be/${id}) - ${secObj.h ? `${secObj.h}h ` : ''}${secObj.m ? `${secObj.m}m ` : ''}${secObj.s}s` } });
	} else if (type === 2) {
		let filename = id.match(discordRegex)[1];

		message.channel.send({
			embed: {
				title: 'Added to queue',
				color: 0x427df4,
				description: `[${filename}](${id}) has been added to the queue.\n*If mp3/ogg file is fake, it will simply be skipped*`,
				footer: {
					text: `Requested by ${message.author.tag}`
				}
			}
		});

		message.guild.music.queue.push({ type: type, person: message.author, id: id, meta: { title: filename, queueName: `[${filename}](${id})`, url: id } });
	} else if (type === 3) {
		message.guild.music.queue.push({ type: type, person: message.author, id: id, meta: { title: id, queueName: id, url: 'https://github.com/Gymnophoria/Arthur'}});
	} else if (type === 4) {
		let filename = id.match(songRegex)[1];

		message.channel.send({
			embed: {
				title: 'Now Playing',
				color: 0x427df4,
				description: `[${filename}](${id})`,
				footer: {
					text: `Added by ${message.author.tag}`
				}
			}
		});

		message.guild.music.queue.push({ type: type, person: message.author, id: id, meta: { title: filename, queueName: `[${filename}](${id})`, url: id } });
	}
};

exports.run = async (message, args, suffix, client) => {
	if (!message.member.voiceChannel) return message.channel.send('Hey man, I can\'t just play music through your speakers magically. Could you like.. connect to a voice channel?');
	if (!args[0] && !message.attachments.size) return message.channel.send('What? Do you want me to just play some random song? You seriously think I\'d do that? No. Choose your song.');

	let id;
	let type = 1;

	/*
		1 - YouTube
		2 - Uploaded File
		3 - Local File
		4 - File from URL

			in the future, next number for soundcloud
	 */
	if (message.attachments.size) {
		type = 2;
		id = message.attachments.first().url;

		if (!id.endsWith('.mp3') && !id.endsWith('.ogg')) return message.channel.send('I only support playback of mp3\'s and oggs for now. Go ahead and message Gymnophoria#8146 if you need another audio file type supported.');
		if (message.attachments.first().filesize < 25000) return message.channel.send('Your file isn\'t powerful enough! I need one bigger than 25 KB, thanks.');

		if (message.guild.music && message.guild.music.queue) add(message, id, 2).catch(console.error);
	} else if (args[0] === 'liked' || args[0] === 'likes') {
		let row = await sql.get(`SELECT songLikes FROM misc WHERE userID = '${message.author.id}'`);
		if (!row) return message.channel.send('If you haven\'t liked a song yet, it\'s quite challenging for me to play a liked song.');

		let array = JSON.parse(row.songLikes);
		if (!array.length) return message.channel.send('If you haven\'t liked a song yet, it\'s quite challenging for me to play a liked song.');

		if (!args[1]) return message.channel.send('Yes, I\'ll just pick the song you want. Y\'know, because I have telepathic powers. (tell me which song to play)');
		let num = parseInt(args[1]);
		if (!num) return message.channel.send('Hey.. that\'s not a number.. (or you chose zero, which really isn\'t a song number so yeah)');
		if (num < 1) return message.channel.send('there is no negative song tho <:crazyeyes:359106555314044939>');
		if (num > array.length) return message.channel.send('I\'m sorry, but you just haven\'t liked that many songs yet.');

		type = array[num - 1].type;
		id = array[num - 1].id;

		if (message.guild.music && message.guild.music.queue) add(message, id, type).catch(console.error);
	} else if (args[0] === 'top') {
		let thingy = await Music.likedArray();
		let array = thingy[0];

		if (!args[1]) return message.channel.send('Yes, I\'ll just pick the song you want. Y\'know, because I have telepathic powers. (tell me which song to play)');
		let num = parseInt(args[1]);
		if (!num) return message.channel.send('Hey.. that\'s not a number.. (or you chose zero, which really isn\'t a song number so yeah)');
		if (num < 1) return message.channel.send('there is no negative song tho <:crazyeyes:359106555314044939>');
		if (num > array.length) return message.channel.send('I\'m sorry, but there just aren\'t that many liked songs yet.');

		let obj = array[num - 1];
		type = obj.type;
		id = obj.id;

		if (message.guild.music && message.guild.music.queue) add(message, id, type).catch(console.error);
	} else if (args[0] === 'file') {
		type = 3;
		let files = fs.readdirSync('../media/sounds');
		files = files.map(f => f.replace(/\.mp3/g, ''));

		if (!args[1]) return message.channel.send('Mhm, I\'ll make sure to play that nothingness real soon.');
		if (!files.includes(args[1])) return message.channel.send(`Darn! That file doesn't exist. You can suggest to add it by DMing Gymnophoria#8146. The files you *can* play are as follows: ${files.map(f => '`' + f + '`').join(', ')}`);

		id = args[1];

		if (message.guild.music && message.guild.music.queue) add(message, id, 3).catch(console.error);
	} else if (YTRegex.test(args[0])) {
		id = args[0].match(YTRegex)[4];

		if (message.guild.music && message.guild.music.queue) add(message, id, 1).catch(console.error);
	} else if (args[0].endsWith('.mp3') || args[0].endsWith('.ogg')) {
		type = 4;
		id = args[0];

		if (message.guild.music && message.guild.music.queue) add(message, id, 2).catch(console.error);
	} else { //  if (!YTRegex.test(args[0]))
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
	}

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

	if (!message.guild.music || !message.guild.music.queue) {
		if (!message.member.voiceChannel.joinable) return message.channel.send('I can\'t join the channel you\'re in.');

		message.guild.music = {};
		message.guild.music.channel = message.member.voiceChannel;

		message.member.voiceChannel.join().then(async () => {
			message.guild.music.playing = true;

			if (type === 1) { // youtube video
				if (!id) return;
				let info = await ytdl.getInfo(id);

				if (info.livestream === '1' || info.live_playback === '1' || (info.length_seconds > 4200 && !client.dbotsUpvotes.includes(message.author.id))) {
					message.guild.music = {};
					message.member.voiceChannel.leave();
					return message.channel.send(info.length_seconds > 1800
						? 'Hey there my dude that\'s a bit much, I don\'t wanna play a song longer than 30 minutes for ya...\nUnless you go [upvote me](https://discordbots.org/bot/329085343800229889).. *shameless self promotion* (upvotes can take up to 10 minutes to register, be patient)'
						: 'Trying to play a livestream, eh? I can\'t do that, sorry.. ;-;');
				}

				let secObj = secSpread(info.length_seconds);

				message.guild.music.queue = [ { type: type, person: message.author, id: id, meta: { url: `https://youtu.be/${id}`, title: `${info.title} (${secObj.h ? `${secObj.h}h ` : ''}${secObj.m ? `${secObj.m}m ` : ''}${secObj.s}s)`, queueName: `[${info.title}](https://youtu.be/${id}) - ${secObj.h ? `${secObj.h}h ` : ''}${secObj.m ? `${secObj.m}m ` : ''}${secObj.s}s` } } ];

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

				Music.next(message.guild, true)
			} else if (type === 2) { // file url
				let filename = id.match(discordRegex)[1];

				message.channel.send({
					embed: {
						author: {
							name: 'Now Playing'
						},
						color: 0x427df4,
						description: `[${filename}](${id})\n*Or not, a fake mp3/ogg it will simply be skipped*`,
						footer: {
							text: `File uploaded by ${message.author.tag}`
						}
					}
				});

				message.guild.music.queue = [ { type: type, person: message.author, id: id, meta: { title: filename, queueName: `[${filename}](${id})`, url: id } } ];

				Music.next(message.guild, true);
			} else if (type === 3) { // local file
				message.guild.music.queue = [ { type: type, person: message.author, id: id, meta: { title: id, queueName: id, url: 'https://github.com/Gymnophoria/Arthur' } } ];

				Music.next(message.guild, true);
			} else if (type === 4) {
				let filename = id.match(songRegex)[1];

				message.channel.send({
					embed: {
						title: 'Now Playing',
						color: 0x427df4,
						description: `[${filename}](${id})`,
						footer: {
							text: `Added by ${message.author.tag}`
						}
					}
				});

				message.guild.music.queue = [ { type: type, person: message.author, id: id, meta: { title: filename, queueName: `[${filename}](${id})`, url: id } } ];

				Music.next(message.guild, true);
			}
		})
	}
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