const request = require('request');
const { toJson } = require('xml2json');

exports.run = (message) => {
	request('http://thecatapi.com/api/images/get?format=xml', (err, response, body) => {
		if (err) return message.channel.send('THere was an error. Contact Gymnophoria#8146 if you need your cats ASAP.');
		const json = JSON.parse(toJson(body));

		message.channel.send({embed: {
			description: `Original image [here](${json.response.data.images.image.source_url})`,
			image: {
				url: json.response.data.images.image.url
			},
			color: 0x00c140
		}})
	});
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['kitty', 'kat', 'kitten'],
	perms: ['EMBED_LINKS']
};

exports.help = {
	name: 'Cat',
	description: 'Get a cat picture.',
	usage: 'cat',
	help: 'Get a cat picture from [The Cat API](http://thecatapi.com/).',
	category: 'APIs'
};