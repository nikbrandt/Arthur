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
		cookies: []
	};

	let msg;

	message.channel.send('Loading..').then(m => msg = m);

	webshot(args[0], `../media/temp/${date}-${message.author.id}.png`, options, err => {
		msg.delete();
		if (err) return message.channel.send('Hey, you gotta provide me with a *valid* url, okay? Your trickery caused you a 20 second cooldown, mister.');
		message.channel.send(`Here's your render of ${args[0]}:`, {files: [`../media/temp/${date}-${message.author.id}.png`]}).then(() => {
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
	category: 'APIs'
};