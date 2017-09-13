const Discord = require('discord.js');
const webshot = require('webshot');
const fs = require('fs');

exports.run = (message, args, s, client) => {
	if (!args[0]) return message.channel.send('You have to tell me what to take a picture of..');
	if (args[0].includes('porn')) return message.channel.send('please..');
	let index = client.processing.length;
	client.processing.push(message.id + ' - Webshot');
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
	let del = false;

	message.channel.send('Loading..').then(m => {
		if (del) m.delete();
		else msg = m;
	});

	webshot(args[0], `../media/temp/${date}-${message.author.id}.png`, options, err => {
		if (err) {
			if (err.toString().includes('value 1')) message.channel.send('Hey, you gotta provide me with a *valid* url, okay? Your trickery caused you a 10 second cooldown, mister.');
			if (err.toString().includes('timeout setting')) message.channel.send('That website is too powerful! It\'s taken me more than 30 seconds to render, so I\'m canceling. Sorry!');
			client.processing.splice(index, 1);
			return;
		}

		message.channel.send({embed: new Discord.RichEmbed()
			.setTitle(`Render of ${args[0]}`)
			.setDescription(`Website can be found [here](${args[0]})\nI am not responsible for the content of this website.`)
			.attachFile(`../media/temp/${date}-${message.author.id}.png`)
			.setImage(`attachment://${date}-${message.author.id}.png`)
			.setFooter(`Requested by ${message.author.tag}`)
			.setColor(0x00c140)
		}).then(() => {
			if (msg) msg.delete();
			else del = true;
			fs.unlinkSync(`../media/temp/${date}-${message.author.id}.png`);
			client.processing.splice(index, 1);
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