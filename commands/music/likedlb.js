const Music = require('../../struct/Music');

exports.run = async (message, args) => {
	let array = await Music.likedArray();

	let maxPage = Math.ceil(array.length / 10); // check that parsed number is correct
	let page = 1;
	if (args[0]) {
		let num = parseInt(args[0]);
		if (!num) return message.channel.send(i18n.get('commands.liked.invalid_page', message));
		if (num < 1) return message.channel.send(i18n.get('commands.liked.negative_page', message));
		if (num > maxPage) return message.channel.send(i18n.get('commands.liked.nonexistent_page', message));
		page = num;
	}

	array = array.slice(page * 10 - 10, page * 10); // slice array down to 5 songs - the five of current page
	let startNum = page * 10 - 9;
	let final = [];

	for (let i = 0; i < array.length; i++) { // push each song to the final array, as the song will be displayed
		final.push(`**${startNum}**. ${array[i].queueName} - ${array[i].count} ${array[i].count - 1 ? message.__('likes') : message.__('like')}`);
		startNum++;
	}

	message.channel.send({embeds: [{
		title: message.__('top_liked_songs'),
		description: final.join('\n'),
		color: 0x427df4,
		footer: {
			text: message.__('footer', { page, maxPage })
		}
	}]});
};

exports.config = {
	enabled: true,
	permLevel: 2,
	category: 'music'
};