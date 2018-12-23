const request = require('request');
const { toJson } = require('xml2json');

exports.run = (message) => {
	request('http://thecatapi.com/api/images/get?format=xml', (err, response, body) => {
		if (err) return message.channel.send(message.__('error'));
		let json;
		
		try {
			json = JSON.parse(toJson(body));
		} catch (e) {
			return message.channel.send(message.__('error'))
		}

		if (!json || !json.response || !json.response.data) return message.channel.send(message.__('error'));

		message.channel.send({embed: {
			description: message.__('embed_description', { url: json.response.data.images.image.source_url }),
			image: {
				url: json.response.data.images.image.url
			},
			color: 0x00c140
		}})
	});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	perms: ['EMBED_LINKS']
};