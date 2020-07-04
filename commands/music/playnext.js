exports.run = (message, args, suffix, client, permLevel, prefix, ipc) => {
	message.__ = (string, variables) => {
		return i18n.get('commands.play.' + string, message, variables);
	};

	message.playnext = true;

	client.commands.get('play').run(message, args, suffix, client, permLevel, prefix, ipc).catch(client.errorLog.simple);
};

exports.config = {
	enabled: true,
	permLevel: 2,
	category: 'music'
};