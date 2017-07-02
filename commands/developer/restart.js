exports.run = (message, args, suffix, client) => {
	if (!client.config.owners.includes(message.author.id)) return;
	message.channel.send('Restarting.').then(m => process.exit(0));
};

exports.config = {
	enabled: true,
	permLevel: 10,
	aliases: ['kys', 'die']
};

exports.help = {
	name: 'Restart',
	description: 'Restart the bot',
	usage: 'restart',
	help: 'How hard is to comprehend? Restart. The. Bot.',
	category: 'Developer'
};