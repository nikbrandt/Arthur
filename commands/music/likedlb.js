const Music = require('../../struct/music');

exports.run = async (message, args) => {
	let thingy = await Music.likedArray();
	let almostThereBud = thingy[0],
		counts = thingy[1];

	let maxPage = Math.ceil(almostThereBud.length / 10); // check that parsed number is correct
	let page = 1;
	if (args[0]) {
		let num = parseInt(args[0]);
		if (!num) return message.channel.send('Eyy that\'s not a page number, I\'d love it if you\'d supply me with a *real* page number, thanks.');
		if (num < 1) return message.channel.send('Negative pages don\'t exist. Okay? Think of a book. Does said book have a page -3? I didn\'t think so.');
		if (num > maxPage) return message.channel.send('That page doesn\'t exist yet. Go like a ton of songs, make that page, I believe in you!');
		page = num;
	}

	almostThereBud = almostThereBud.slice(page * 10 - 10, page * 10); // slice array down to 5 songs - the five of current page
	let startNum = page * 10 - 9;
	let final = [];

	for (let i = 0; i < almostThereBud.length; i++) { // push each song to the final array, as the song will be displayed
		final.push(`**${startNum}**. ${almostThereBud[i].meta.queueName} - ${counts[almostThereBud[i].id]} like${counts[almostThereBud[i].id] - 1 ? 's' : ''}`);
		startNum++;
	}

	message.channel.send({embed: {
		title: 'Top Liked Songs',
		description: final.join('\n'),
		color: 0x427df4,
		footer: {
			text: `Page ${page} of ${maxPage} | Play a top song with play top <number>`
		}
	}});
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['likedleaderboard', 'likeslb', 'likelb', 'likeleaderboard', 'likesleaderboard', 'topsongs', 'songlb', 'songleaderboard', 'topliked', 'liketop', 'likedtop', 'likestop']
};

exports.help = {
	name: 'Likes Leaderboard',
	description: 'Get a list of the top liked songs.',
	usage: 'likedlb [page]',
	help: 'View the top liked songs of the bot.',
	category: 'Music'
};