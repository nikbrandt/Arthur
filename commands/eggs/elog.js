exports.run = (message, args, suffix, client, permLevel, prefix, ipc) => {
	message.__ = (string, variables) => {
		return i18n.get('commands.play.' + string, message, variables);
	};

	client.commands.get('play').run(message, [ 'https://youtu.be/w9uWPBDHEKE' ], 'https://youtu.be/w9uWPBDHEKE', client, permLevel, prefix, ipc).catch(console.error);
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