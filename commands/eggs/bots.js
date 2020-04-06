exports.run = (message) => {
	message.channel.send({files: ['http://i.imgur.com/gyqGdK5.jpg']});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	perms: ['ATTACH_FILES'],
	category: 'eggs'
};

exports.meta = {
	command: 'bots',
	name: 'bots',
	description: 'An easter egg based off bots',
	help: 'An easter egg based off bots'
};