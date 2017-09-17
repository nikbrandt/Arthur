const sql = require('sqlite');

exports.run = async (message) => {
	if (!message.guild.music || !message.guild.music.queue) return message.channel.send('Alright so if there\'s no music playing *how am I gonna like the currently playing song*? Eh? You see how that doesn\'t work?');

	let row = await sql.get(`SELECT songLikes FROM misc WHERE userID = '${message.author.id}'`);
	let json;
	/** @namespace row.songLikes
	 * Amount of songs a user has liked */
	if (!row) json = [];
	else json = JSON.parse(row.songLikes);

	if (json.length && json.some(j => j.id === message.guild.music.queue[0].id)) return message.channel.send('Mhm, you think I\'m gonna let you like a song twice. No. I don\'t care how good it is, go get your ~~alt~~ friend to like it.');

	json.push({
		type: message.guild.music.queue[0].type,
		id: message.guild.music.queue[0].id,
		meta: message.guild.music.queue[0].meta
	});

	console.log(json);
	console.log(JSON.stringify(json));

	sql.run(`UPDATE misc SET songLikes = \`${JSON.stringify(json)}\` WHERE userID = '${message.author.id}'`);

	message.channel.send({
		embed: {
			author: {
				name: 'Song Liked'
			},
			url: message.guild.music.queue[0].meta.url,
			color: 0x427df4,
			description: message.guild.music.queue[0].meta.queueName
		}
	});
};

exports.config = {
	enabled: false,
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