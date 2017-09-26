const sql = require('sqlite');
const Music = require('../../struct/music');

exports.run = async (message, args, suffix, client) => {
	if ((!message.guild.music || !message.guild.music.queue) && !args[0] && !message.attachments.size) return message.channel.send('Alright so if there\'s no music playing *how am I gonna like the currently playing song*? Eh? You see how that doesn\'t work?');

	let row = await sql.get(`SELECT songLikes FROM misc WHERE userID = '${message.author.id}'`);
	let json;
	/** @namespace row.songLikes
	 * Amount of songs a user has liked */
	if (!row) json = [];
	else json = JSON.parse(row.songLikes);

	let id;
	let type;
	let meta;

	if (args[0] || message.attachments.size) {
		let object;
		let info;

		try {
			object = await Music.parseMessage(message, args, suffix, client);
			info = await Music.getInfo(object.type, object.id, message, client, 'asdf');
		} catch (err) {
			return message.channel.send(err);
		}

		id = object.id;
		type = object.type;
		meta = info.meta;
	} else {
		id = message.guild.music.queue[0].id;
		type = message.guild.music.queue[0].type;
		meta = message.guild.music.queue[0].meta;
	}

	if (json.length && json.some(j => j.id === id)) return message.channel.send('Mhm, you think I\'m gonna let you like a song twice. No. I don\'t care how good it is, go get your ~~alt~~ friend to like it.');

	json.push({
		type: type,
		id: id,
		meta: meta
	});

	if (!row) sql.run(`INSERT INTO misc (userID, songLikes) VALUES (?, ?)`, [message.author.id, JSON.stringify(json)]);
	else sql.run(`UPDATE misc SET songLikes = ? WHERE userID = '${message.author.id}'`, JSON.stringify(json));

	message.channel.send({
		embed: {
			author: {
				name: 'Song Liked'
			},
			url: meta.url,
			color: 0x427df4,
			description: meta.queueName
		}
	});
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['goodshit', 'ilovethisfuckingsong', 'dudethissongishot', 'nicesong', 'godlysong', 'iwant', 'amazingsong']
};

exports.help = {
	name: 'Like Song',
	description: 'Like the currently playing song',
	usage: 'like',
	help: 'Likes the currently playing song. View all your likes with the `likes` command.',
	category: 'Music'
};