exports.run = (message, args, suffix, client, permLevel, prefix, ipc) => {
	message.__ = (string, variables) => {
		return i18n.get('commands.play.' + string, message, variables);
	};

	const song = 'https://youtu.be/7tBi4Z7yexY';

	client.commands.get('play').run(message, [ song ], song, client, permLevel, prefix, ipc).catch(client.errorLog.simple);
};

exports.config = {
	enabled: 'true',
	permLevel: 2,
	perms: [ 'EMBED_LINKS', 'SPEAK', 'CONNECT' ],
	category: 'eggs'
};

exports.meta = {
	command: 'wap',
	name: 'wap, but gilbert gottfried',
	description: 'wap, babey',
	help: 'YEAH, YEAH, YEAH'
};