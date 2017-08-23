exports.run = (message) => {
	const links = [
		'http://i.imgur.com/qKlnz5n.jpg',
		'http://i.imgur.com/EWNKZfA.jpg',
		'http://i.imgur.com/hqHdmel.jpg',
		'http://i.imgur.com/HOSmQe1.jpg'
	];

	message.channel.send({files: [links[Math.floor(Math.random() * (links.length))]]});
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['ninten']
};

exports.help = {
	name: 'NintenBot',
	description: 'An easter egg based off NintenBot',
	usage: 'nintenbot',
	help: 'An easter egg based off NintenBot',
	category: 'Eggs'
};