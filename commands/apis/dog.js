const request = require('request');

exports.run = message => {
	request('http://dog.ceo/api/breeds/image/random', (err, response, body) => {
		if (err) return message.channel.send(message.__('error'));
		let json;
		try {
			json = JSON.parse(body);
		} catch (e) {
			return message.channel.send(message.__('error'));
		}
		
		if (!json) return message.channel.send(message.__('error'));
		
		message.channel.send({embed: {
			description: message.__('embed_description', { url: json.message }),
			image: {
				url: json.message
			},
			color: 0x00c140
		}})
	});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	aliases: ['doggo', 'pupper', 'puppy', 'pup', 'woof', 'bark', 'doge'],
	perms: ['EMBED_LINKS']
};

exports.help = {
	name: 'Dog',
	description: 'Get a free dog photo.',
	usage: 'dog',
	help: 'Get a photo of a dog.',
	category: 'APIs'
};
