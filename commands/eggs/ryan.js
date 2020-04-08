exports.run = message => {
	if (message.author.id !== '304716594104369162') return message.channel.send('no.');
	
	message.client.daniel = !message.client.daniel;
	if (message.client.daniel) message.channel.send('yep, ok.');
	else message.channel.send('alright it\'s off.');
};

exports.config = {
	enabled: true,
	permLevel: 1,
	category: 'eggs'
};

exports.meta = {
	command: 'ryan',
	name: 'Ryan',
	description: 'hehehehehehehe',
	help: 'hehehehehehehehehehehehehehe'
};