const sql = require('sqlite');
const Music = require('../../struct/music');

exports.run = async (message, args, suffix, client) => {
	if ((!message.guild.music || !message.guild.music.queue) && !args[0] && !message.attachments.size) return message.channel.send(message.__('no_song_specified'));

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

	let dupeCheck = await sql.get(`SELECT count(1) FROM musicLikes WHERE userID = '${message.author.id}' AND id = '${id}'`);
	if (dupeCheck['count(1)']) return message.channel.send(message.__('song_already_liked'));

	sql.run(`INSERT INTO musicLikes (userID, type, id, url, title, queueName) VALUES (?, ?, ?, ?, ?, ?)`, [message.author.id, type, id, meta.url, meta.title, meta.queueName]);

	message.channel.send({
		embed: {
			author: {
				name: `${message.author.username} - ${message.__('song_liked')}`
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
	category: 'music',
	cooldown: 1000
};