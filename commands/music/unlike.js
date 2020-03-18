const sql = require('sqlite');

exports.run = async (message, args) => {
	let rows = await sql.all(`SELECT title, id FROM musicLikes WHERE userID = '${message.author.id}'`);
	if (!rows || !rows.length) return message.channel.send(message.__('no_likes'));

	let num;

	if (!args[0] && (!message.guild.music && !message.guild.music.queue)) return message.channel.send(message.__('no_args'));

	if (args[0]) {
		num = parseInt(args[0]);
		if (!num) return message.channel.send(message.__('invalid_number'));
		if (num < 1) return message.channel.send(message.__('negative_number'));
		if (num > rows.length) return message.channel.send(message.__('too_high_number'));
	} else {
		if (!message.guild.voice) return message.channel.send(message.__('no_voice_connection'));
		let index = rows.findIndex(o => o.id === message.guild.music.queue[0].id);
		if (index === -1) return message.channel.send(message.__('song_not_liked'));
		num = index + 1;
	}

	let title = rows[num - 1].title;
	await sql.run(`DELETE FROM musicLikes WHERE userID = '${message.author.id}' AND id = '${rows[num - 1].id}'`);
	message.channel.send({embed: {
		title: message.__('song_unliked'),
		description: `${title}`,
		color: 0x427df4
	}});
};

exports.config = {
	enabled: true,
	permLevel: 2,
	category: 'music'
};