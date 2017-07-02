exports.run = (message, args, suffix, client, perms) => {
	message.channel.send({files: ['http://i.imgur.com/IJCXt7X.jpg']});
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: []
};

exports.help = {
	name: 'gymno',
	description: 'An easter egg based off gymno',
	usage: 'gymno',
	help: 'An easter egg based off gymno',
	category: 'Eggs'
};