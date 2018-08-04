const Discord = require('discord.js');
const webshot = require('webshot');
const moment = require('moment');
const fs = require('fs');

let nonobad = [ 'file://', 'ip', 'porn', 'redtube', 'sex', 'rule34', 'amateur', 'cuckold', 'creampie', 'cum', 'jiz', 'milf', 'orgasm', 'orgy', 'threesome', 'ass', 'tit', 'dick', 'penis', 'despacito', 'pussy', 'fuck', 'finger', 'bang', 'hentai', 'yaoi', 'virgin', 'handjob', 'blowjob', 'xxx', 'milf' ];

exports.run = async (message, args, s, client) => {
	if (!args[0]) return message.channel.send(message.__('no_args'));
	if (nonobad.some(i => args[0].toLowerCase().includes(i))) return message.channel.send(message.__('blacklisted_website'));
	let index = client.processing.length;
	client.processing.push(moment().format('h:mm:ss A') + ' - Webshot');
	let date = Date.now();
	let sent = false;

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
	let cancel = false;

	message.channel.send(message.__('loading')).then(m => {
		if (del) m.delete();
		else msg = m;
	});
	
	setTimeout(function () {
		if (!sent) {
			message.channel.send(message.__('timed_out'));
			cancel = true;
			client.processing.splice(index, 1);
		}
	}, 35000); // if webshot not complete in 35 seconds, cancel operation.

	webshot(args[0], `../media/temp/${date}-${message.author.id}.png`, options, err => {
		if (cancel) return;

		if (err) {
			if (err.toString().includes('value 1')) message.channel.send(message.__('invalid_url'));
			else if (err.toString().includes('timeout setting')) message.channel.send(message.__('timed_out'));
			else message.channel.send(message.__('unknown_error', { err: err.toString() }));
			client.processing.splice(index, 1);
			sent = true;
			return;
		}

		message.channel.send({embed: new Discord.RichEmbed()
			.setTitle(message.__('title', { url: args[0].length > 245 ? args[0].slice(0, -(args[0].length - 245)) : args[0] }))
			.setDescription(message.__('description', { url: args[0].startsWith('https://') || args[0].startsWith('http://') ? args[0] : 'https://' + args[0] }))
			.attachFile(`../media/temp/${date}-${message.author.id}.png`)
			.setImage(`attachment://${date}-${message.author.id}.png`)
			.setFooter(message.__('footer', { name: message.author.tag }))
			.setColor(0x00c140)
		}).then(() => {
			sent = true;
			if (msg) msg.delete();
			else del = true;
			fs.unlinkSync(`../media/temp/${date}-${message.author.id}.png`);
			client.processing.splice(index, 1);
		});
	});
};

exports.config = {
	enabled: true,
	permLevel: 1,
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
