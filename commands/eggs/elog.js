const LINKS = [ 'https://youtu.be/p5rQHoaQpTw', 'https://youtu.be/w9uWPBDHEKE' ];

exports.run = (message, args, suffix, client, permLevel, prefix, ipc) => {
	message.__ = (string, variables) => {
		return i18n.get('commands.play.' + string, message, variables);
	};

	const song = LINKS[Math.floor(Math.random() * LINKS.length)];

	client.commands.get('play').run(message, [ song ], song, client, permLevel, prefix, ipc).catch(client.errorLog.simple);
};

exports.config = {
	enabled: 'true',
	permLevel: 2,
	perms: [ 'EMBED_LINKS', 'SPEAK', 'CONNECT' ],
	category: 'eggs'
};

exports.meta = {
	command: 'elog',
	name: 'E Log',
	description: '"What\'s another way to say hello?"',
	help: '"What\'s another way to say hello?"'
};