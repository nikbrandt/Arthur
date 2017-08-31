const request = require('request');

exports.run = message => {
	request('http://dog.ceo/api/breeds/image/random', (err, response, body) => {
		if (err) return message.channel.send('There was an error. Contact Gymnophoria#8146 if you need dogs ASAP.');
		const json = JSON.parse(body);

		message.channel.send({embed: {
			description: `Original image [here](${json.message})`,
			image: {
				url: json.message
			},
			color: 0x00c140
		}})
	});
};

exports.config = {
	enabled: true,
	permLevel: 2,
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