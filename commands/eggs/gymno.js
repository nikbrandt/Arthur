exports.run = (message) => {
	message.channel.send({files: ['http://i.imgur.com/IJCXt7X.jpg']});
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['jim'],
	perms: ['ATTACH_FILES'],
	category: 'eggs'
};

exports.meta = {
	command: 'gymno',
	name: 'gymno',
	description: 'An easter egg based off gymno',
	usage: 'gymno',
	help: 'An easter egg based off gymno'
};