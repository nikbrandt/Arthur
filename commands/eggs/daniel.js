const { getSubredditMeme } = require('../fun/meme');

exports.run = message => {
	getSubredditMeme('ANormalDayInRussia').then(meme => {
		message.channel.send({ embed: {
			author: {
				icon_url: 'https://cdn.discordapp.com/emojis/585296471880892461.png?v=1',
				name: meme.title
			},
			image: {
				url: `https://i.imgur.com/${meme.hash}${meme.ext}`
			},
			color: 0xff0019
		}});
	}).catch(() => {
		message.channel.send('didn\'t work, sorry. :(');
	})
};

exports.config = {
	enabled: true,
	permLevel: 1,
	aliases: [ 'russia', 'russiaman', 'vodka', 'bear' ],
	perms: [ 'ATTACH_FILES', 'EMBED_LINKS' ],
	category: 'eggs'
};

exports.meta = {
	command: 'daniel',
	name: 'Daniel',
	description: 'Just for you, Daniel.',
	usage: 'daniel',
	help: 'Just for you, Daniel.'
};