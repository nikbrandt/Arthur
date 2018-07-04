const Discord = require('discord.js');
const util = require('util');

exports.run = (message, args, suffix, client) => {
	let number = 89;
	let users = new Discord.Collection();

	if (args[0]) {
		let tempNumber = parseInt(args[0]);
		if (tempNumber) number = tempNumber;
		if (tempNumber > 89) number = 89;
		if (tempNumber < 1) number = 1;
	}

	client.guilds.filter(guild => {
		return guild.members.has(message.author.id);
	}).forEach(guild => {
		users = guild.members.concat(users);
	});

	users = users.filter(member => {
		return member.presence.game && member.presence.game.name === 'Spotify';
	});

	users = users.random(number);

	message.channel.send( { embed: {
		color: 0x00c140,
		title: `${number} random users playing Spotify`,
		description: users.map(user => user.user.toString()).join(' ')
	} } );
};

exports.config = {
	enabled: true,
	permLevel: 9,
	aliases: [ 'spotify', 'spusers', 'susers', 'spotifys', 'spotifies', 'musicusers' ],
	perms: [ 'EMBED_LINKS' ]
};

exports.help = {
	name: 'Spotify Users',
	description: 'Get a list of *x* users currently listening to Spotify.',
	usage: 'spotifyusers [amount]',
	help: 'Get a list of `amount` users currently listening to Spotify. Default 20. Users must share a server with you; if you\'re not seeing many, try joining one or both of the Discord Bots servers.',
	category: 'Developer'
};