exports.run = (message, args, suffix, client, permLevel) => {

};

exports.config = {
	enabled: true,
	permLevel: 10,
	aliases: ['bl']
};

exports.help = {
	name: 'Blacklist User',
	description: 'Blacklist a user from using commands in your server.',
	usage: 'blacklist <user resolvable>',
	help: 'Blacklist a user from using commands on your server. Give me a user ID, mention, or tag (username#0000).',
	category: 'Server Management'
};