exports.run = (message, args, suffix, client, permLevel) => {
	message.__ = (string, variables) => {
		return i18n.get('commands.skip.' + string, message, variables);
	};

	try {
		client.commands.get('skip').run(message, [ '-f' ], '-f', client, permLevel);
	} catch (error) {
		client.errorLog.simple(error);
	}
};

exports.config = {
	enabled: true,
	permLevel: 2,
	category: 'music'
};