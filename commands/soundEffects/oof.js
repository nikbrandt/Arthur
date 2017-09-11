const play = require('../music/play.js').run;

exports.run = (message, args, suffix, client) => {
	play(message, ['file', 'oof'], suffix, client);
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: [],
	perms: ['EMBED_LINKS', 'SPEAK', 'CONNECT'],
	guildCooldown: 1000
};

exports.help = {
	name: 'oof',
	description: 'Alias for `play file oof`',
	usage: 'oof',
	help: 'Alias for `play file oof`. Plays the `oof` sound effect.',
	category: 'Sound Effects'
};