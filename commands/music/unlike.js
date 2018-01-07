const sql = require('sqlite');

exports.run = async (message, args) => {
	let rows = await sql.all(`SELECT title, id FROM musicLikes WHERE userID = '${message.author.id}'`);
	if (!rows || !rows.length) return message.channel.send('If you haven\'t liked a song yet, it\'s quite challenging for me to unlike a song.');

	let num;

	if (!args[0] && (!message.guild.music && !message.guild.music.queue)) return message.channel.send('Yes, I\'ll just pick the song you want. Y\'know, because I have telepathic powers. (tell me which song to remove)');

	if (args[0]) {
		num = parseInt(args[0]);
		if (!num) return message.channel.send('Hey.. that\'s not a number.. (or you chose zero, which really isn\'t a song number so yeah)');
		if (num < 1) return message.channel.send('there is no negative song tho <:crazyeyes:359106555314044939>');
		if (num > rows.length) return message.channel.send('I\'m sorry, but you just haven\'t liked that many songs yet.');
	} else {
		if (!message.guild.voiceConnection) return message.channel.send('You have to tell me which song to unlike, lul.');
		let index = rows.findIndex(o => o.id === message.guild.music.queue[0].id);
		if (index === -1) return message.channel.send('Ey bud you haven\'t even liked this song yet - how would you unlike it?');
		num = index + 1;
	}

	let title = rows[num - 1].title;
	await sql.run(`DELETE FROM musicLikes WHERE userID = '${message.author.id}' AND id = '${rows[num - 1].id}'`);

	message.channel.send(`Tada! Song #${num} (*${title}*) has been removed from your liked songs.`);
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['dislike']
};

exports.help = {
	name: 'Unlike Song',
	description: 'Unlike that one song you liked',
	usage: 'unlike <song number>',
	help: 'Unlike that one song you liked a while ago because you now realize it\'s not as good as you thought it was.',
category: 'Music'
};