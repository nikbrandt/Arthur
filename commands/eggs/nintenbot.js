exports.run = (message) => {
	message.channel.send({files: ['http://i.imgur.com/qKlnz5n.jpg']});
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['ninten']
};

exports.help = {
	name: 'eggs/nintenbot',
	description: 'An easter egg based off eggs/nintenbot',
	usage: 'eggs/nintenbot',
	help: 'An easter egg based off eggs/nintenbot',
	category: 'Eggs'
};