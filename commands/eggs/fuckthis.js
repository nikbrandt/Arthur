exports.run = (message, args, suffix, client, perms) => {
	message.channel.send({files: ['http://i.imgur.com/IC84G1h.gif']});
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['ft']
};

exports.help = {
	name: 'fuckthis',
	description: 'An easter egg based off fuckthis',
	usage: 'fuckthis',
	help: 'An easter egg based off fuckthis',
	category: 'Eggs'
};