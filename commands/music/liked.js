exports.run = async (message, args) => {
	let rows = await sql.all(`SELECT queueName FROM musicLikes WHERE userID = '${message.author.id}'`);
	if (!rows || !rows.length) return message.channel.send(message.__('no_likes'));

	let songArray = [];

	for (let i = 0; i < rows.length; i++) {
		songArray.push(`${i + 1}. ${rows[i].queueName}`);
	}

	let maxPage = Math.ceil(songArray.length / 10); // check that parsed number is correct
	let page = 1;
	if (args[0]) {
		let num = parseInt(args[0]);
		if (!num) return message.channel.send(message.__('invalid_page'));
		if (num < 1) return message.channel.send(message.__('negative_page'));
		if (num > maxPage) return message.channel.send(message.__('nonexistent_page'));
		page = num;
	}

	songArray = songArray.slice(page * 10 - 10, page * 10);

	message.channel.send({embeds: [{
		title: message.__('liked_songs', { name: message.member.displayName, s: message.member.displayName.endsWith('s') ? '\'' : '\'s' }),
		description: songArray.join('\n'),
		color: 0x427df4,
		footer: {
			text: message.__('footer', { page, maxPage })
		}
	}]})
};

exports.config = {
	enabled: true,
	permLevel: 2,
	category: 'music'
};