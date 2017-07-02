exports.run = (message, args, asdf, client) => {
	message.channel.send('Check your DM\'s 📬');
	message.author.send({embed: {
		title: 'Arthur - Yet another Discord bot',
		description: `A rewrite of Marvin, with tons of average features.\n invite link here | github here | guild here | trello here`,
		color: 0x00c140,
		fields: [
			{
				name: 'Author',
				value: client.owner.tag,
				inline: true
			},
			{
				name: 'Help',
				value: '@Arthur help',
				inline: true
			},
			{
				name: 'Info',
				value: `Language: Javascript. Node: \`8.1.2\`. Discord.JS: \`11.1\``
			}
		]
	}});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	aliases: ['bot']
};

exports.help = {
	name: 'Info',
	description: 'View information about Arthur.',
	usage: 'info',
	help: 'It\'s really just info about the bot.',
	category: 'Other'
};