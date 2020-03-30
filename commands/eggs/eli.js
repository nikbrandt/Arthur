exports.run = message => {
	message.channel.send({ files: [ 'https://i.imgur.com/NssVxHZ.png' ]});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	aliases: [ 'elijah' ],
	perms: [ 'ATTACH_FILES' ],
	category: 'eggs'
};

exports.meta = {
	command: 'eli',
	name: 'Eli',
	description: 'Eli\'s lovely easter egg photo.',
	usage: 'eli',
	help: 'Eli\'s lovely easter egg photo.'
};