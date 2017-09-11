const play = require('../music/play.js').run;

exports.run = (message, args, suffix, client) => {
	play(message, ['file', 'rickroll'], suffix, client);
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: [],
	perms: ['EMBED_LINKS', 'SPEAK', 'CONNECT'],
	guildCooldown: 1000
};

exports.help = {
	name: 'rickroll',
	description: 'Alias for `play file rickroll`',
	usage: 'rickroll',
	help: 'Alias for `play file rickroll`. Plays the `rickroll` sound effect.',
	category: 'Sound Effects'
};