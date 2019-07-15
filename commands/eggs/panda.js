exports.run = (message) => {
	message.channel.send({files: ['../media/images/magicpanda.jpg']});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	perms: ['ATTACH_FILES'],
	category: 'eggs'
};

exports.meta = {
	command: 'panda',
	name: 'panda',
	description: 'An easter egg for Lumine',
	usage: 'panda',
	help: 'An easter egg for Lumine'
};