exports.run = (message) => {
	message.channel.send({files: ['https://i.imgur.com/PhY66kU.png']});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	perms: ['ATTACH_FILES'],
	category: 'eggs'
};

exports.meta = {
	command: 'garfield',
	name: 'garfield',
	description: 'An easter egg based off garfield',
	help: 'An easter egg based off garfield'
};
