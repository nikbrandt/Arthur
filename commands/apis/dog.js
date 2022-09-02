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

		message.channel.send({embeds: [{
			description: message.__('embed_description', { url: json.message }),
			image: {
				url: json.message
			},
			color: 0x00c140
		}]})
	});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	perms: ['EMBED_LINKS'],
	category: 'apis'
};
