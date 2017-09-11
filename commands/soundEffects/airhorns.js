const play = require('../music/play.js').run;

exports.run = (message, args, suffix, client) => {
	play(message, ['file', 'airhorns'], suffix, client);
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: [],
	perms: ['EMBED_LINKS', 'SPEAK', 'CONNECT'],
	guildCooldown: 1000
};

exports.help = {
	name: 'airhorns',
	description: 'Alias for `play file airhorns`',
	usage: 'airhorns',
	help: 'Alias for `play file airhorns`. Plays the `airhorns` sound effect.',
	category: 'Sound Effects'
};