const webshot = require('webshot');
const fs = require('fs');

exports.run = (message, args) => {
	if (!args[0]) return message.channel.send('You have to tell me what to take a picture of..');
	let date = Date.now();

	let options = {
		windowSize: {
			width: 1920,
			height: 1080
		},
		shotSize: {
			width: 'window',
			height: 'all'
		},
		cookies: [],
		timeout: 30000
	};

	let msg;

	message.channel.send('Loading..').then(m => msg = m);

	webshot(args[0], `../media/temp/${date}-${message.author.id}.png`, options, err => {
		if (msg) msg.delete();

		if (err) {
			if (err.toString().includes('value 1')) message.channel.send('Hey, you gotta provide me with a *valid* url, okay? Your trickery caused you a 10 second cooldown, mister.');
			if (err.toString().includes('timeout setting')) message.channel.send('That website is too powerful! It\'s taken me more than 30 seconds to render, so I\'m canceling. Sorry!')
			return;
		}

		message.channel.send(`Here's your render of <${args[0].startsWith('http') ? args[0] : 'https://' + args[0]}>:`, { files: [ { attachment: `../media/temp/${date}-${message.author.id}.png`, name: args[0] + '.png' } ] } ).then(() => {
			fs.unlinkSync(`../media/temp/${date}-${message.author.id}.png`);
		});
	});
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['screenshot', 'ss'],
	perms: ['ATTACH_FILES'],
	cooldown: 10000
};

exports.help = {
	name: 'Webshot',
	description: 'Take a picture of a website.',
	usage: 'webshot <website>',
	help: 'Take a picture of a website.',
	category: 'Other'
};