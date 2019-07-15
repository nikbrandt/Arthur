exports.run = message => message.channel.send('he\'s a blue jay or something idk');

exports.config = {
	enabled: true,
	permLevel: 1,
	category: 'eggs'
};

exports.meta = {
	command: 'jay',
	name: 'Jay',
	description: 'it\'s jay or something',
	usage: 'jay',
	help: 'just jay'
};