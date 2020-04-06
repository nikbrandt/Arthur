exports.run = (message) => {
	message.channel.send({files: ['http://i.imgur.com/IC84G1h.gif']});
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['ft'],
	perms: ['ATTACH_FILES'],
	category: 'eggs'
};

exports.meta = {
	command: 'fuckthis',
	name: 'fuckthis',
	description: 'An easter egg based off fuckthis',
	help: 'An easter egg based off fuckthis'
};