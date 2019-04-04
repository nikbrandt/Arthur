const request = require('request');

exports.run = (message, args, suffix) => {
	if (!args[0]) return message.channel.send(message.__('no_args'));
	if (suffix.length > 256) return message.channel.send(message.__('long_equation'));

	request(`http://api.mathjs.org/v1/?expr=${encodeURIComponent(suffix)}&precision=3`, (err, response, body) => {
		if (err) return message.channel.send(message.__('error'));
		if (body.toLowerCase().startsWith('error')) {
			message.channel.send({embed: {
				title: suffix,
				description: `\`\`\`js\n${body}\n\`\`\``,
				color: 0xff3d3d
			}});
		} else {
			message.channel.send({embed: {
				title: suffix,
				description: `\`\`\`js\n${body}\n\`\`\``,
				color: 0x70ff3d
			}});
		}
	});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	cooldown: 2000,
	perms: ['EMBED_LINKS'],
	category: 'apis'
};