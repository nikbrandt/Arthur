const sql = require('sqlite');

exports.run = async (message, args, suffix, client, permLevel) => {
	let row = await sql.get(`SELECT songLikes FROM misc WHERE userID = '${message.author.id}'`);
	if (!row) return message.channel.send('You don\'t have any likes tho..');

	let array = JSON.parse(row.songLikes);
	if (!array.length) return message.channel.send('You have to like some songs for me to show em\'');

	let songArray = [];

	for (let i = 0; i < array.length; i++) {
		songArray.push(`${i + 1}. ${array[i].meta.queueName}`);
	}

	message.channel.send({embed: {
		title: `${message.member.displayName}'${message.member.displayName.endsWith('s') ? '' : 's'} Liked Songs`,
		description: songArray.join('\n'),
		color: 0x427df4,
		footer: {
			text: 'Play a liked song with play liked <number>'
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
	usage: 'liked',
	help: 'View all your previously liked songs. Play liked songs with `play liked <number>`.',
	category: 'Music'
};