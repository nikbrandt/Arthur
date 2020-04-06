exports.run = (message) => {
	message.channel.send({files: ['https://cdn.discordapp.com/attachments/304429067892031490/585329733210734592/20190603_132205.jpg']});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	perms: ['ATTACH_FILES'],
	category: 'eggs'
};

exports.meta = {
	command: 'dude',
	name: 'dude',
	description: 'As per request of Tudor, dude.',
	help: 'As per request of Tudor, dude.'
};