const play = require('../music/play.js').run;

exports.run = (message, args, suffix, client) => {
	play(message, ['file', 'airhorn'], suffix, client);
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: [],
	perms: ['EMBED_LINKS', 'SPEAK', 'CONNECT'],
	guildCooldown: 1000
};

exports.help = {
	name: 'airhorn',
	description: 'Alias for `play file airhorn`',
	usage: 'airhorn',
	help: 'Alias for `play file airhorn`. Plays the `airhorn` sound effect.',
	category: 'Sound Effects'
};