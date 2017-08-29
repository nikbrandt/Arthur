const request = require('request');

exports.run = (message, args, suffix, client) => {
	if (!args[0]) return message.channel.send('Seriously? You expect me to evaluate nothing? :clap:');

	request(`http://api.mathjs.org/v1/?expr=${encodeURIComponent(suffix)}&precision=3`, (err, response, body) => {
		if (err) return message.channel.send('Your equation is invalid. Rude.');
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
	permLevel: 2,
	aliases: ['calc'],
	cooldown: 2000,
	perms: ['EMBED_LINKS']
};

exports.help = {
	name: 'Math',
	description: 'Evaluate math expressions and conversions.',
	usage: 'math <expression>',
	help: 'Evaluate math expressions or conversions.',
	category: 'APIs'
};