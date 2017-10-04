const sql = require('sqlite');

exports.run = async (message, args) => {
	let rows = await sql.all(`SELECT queueName FROM musicLikes WHERE userID = '${message.author.id}'`);
	if (!rows || !rows.length) return message.channel.send('You don\'t have any likes tho..');

	let songArray = [];

	for (let i = 0; i < rows.length; i++) {
		songArray.push(`${i + 1}. ${rows[i].queueName}`);
	}

	let maxPage = Math.ceil(songArray.length / 10); // check that parsed number is correct
	let page = 1;
	if (args[0]) {
		let num = parseInt(args[0]);
		if (!num) return message.channel.send('Eyy that\'s not a page number, I\'d love it if you\'d supply me with a *real* page number, thanks.');
		if (num < 1) return message.channel.send('Negative pages don\'t exist. Okay? Think of a book. Does said book have a page -3? I didn\'t think so.');
		if (num > maxPage) return message.channel.send('That page doesn\'t exist yet. Go like a ton of songs, make that page, I believe in you!');
		page = num;
	}

	songArray = songArray.slice(page * 10 - 10, page * 10);

	message.channel.send({embed: {
		title: `${message.member.displayName}'${message.member.displayName.endsWith('s') ? '' : 's'} Liked Songs`,
		description: songArray.join('\n'),
		color: 0x427df4,
		footer: {
			text: `Page ${page} of ${maxPage} | Play a liked song with play liked <number>`
		}
	}})
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['likedsongs', 'songlikes', 'likeslist', 'whatwasthatonesong', 'likes']
};

exports.help = {
	name: 'Liked Songs',
	description: 'View all your liked songs',
	usage: 'liked [page]',
	help: 'View all your previously liked songs. Play liked songs with `play liked <number>`.',
	category: 'Music'
};