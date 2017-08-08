exports.run = (message) => {
	message.channel.send({files: ['http://i.imgur.com/gyqGdK5.jpg']});
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: []
};

exports.help = {
	name: 'bots',
	description: 'An easter egg based off bots',
	usage: 'bots',
	help: 'An easter egg based off bots',
	category: 'Eggs'
};