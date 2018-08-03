const requestPromise = require('request-promise');
const Discord = require('discord.js');
const webshot = require('webshot');
const moment = require('moment');
const fs = require('fs');

let nonobad = ['porn', 'redtube', 'sex', 'rule34', 'anal', 'amateur', 'cuckold', 'creampie', 'cum', 'jiz', 'milf', 'orgasm', 'orgy', 'threesome', 'ass', 'tit', 'dick', 'penis', 'despacito', 'pussy', 'fuck', 'finger', 'bang', 'hentai', 'yaoi', 'virgin', 'handjob', 'blowjob', 'xxx', 'milf'];
const ipAddressRegex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/g;

exports.run = async (message, args, s, client) => {
	if (!args[0]) return message.channel.send('You have to tell me what to take a picture of..');
	if (nonobad.some(i => args[0].toLowerCase().includes(i))) return message.channel.send('please..');
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
		timeout: 30000
	};

	let msg;
	let del = false;
	let cancel = false;

	message.channel.send('Loading..').then(m => {
		if (del) m.delete();
		else msg = m;
	});

	let body;
	
	try {
		body = await requestPromise(args[0]);
	} catch (e) {
		return message.channel.send('Hey, you gotta provide me with a *valid* url, okay? Your trickery caused you a 10 second cooldown, mister.');
	}
	
	if (!body) return message.channel.send('Hey, you gotta provide me with a *valid* url, okay? Your trickery caused you a 10 second cooldown, mister.');
	body = body.replace(ipAddressRegex, 'ip address hidden, nerd');
	
	setTimeout(function () {
		if (!sent) {
			message.channel.send('That website is too powerful! It\'s taken me more than 30 seconds to render, so I\'m canceling the render. Sorry!');
			cancel = true;
			client.processing.splice(index, 1);
		}
	}, 35000); // if webshot not complete in 35 seconds, cancel operation.

	webshot(body, `../media/temp/${date}-${message.author.id}.png`, options, err => {
		if (cancel) return;

		if (err) {
			if (err.toString().includes('value 1')) message.channel.send('Hey, you gotta provide me with a *valid* url, okay? Your trickery caused you a 10 second cooldown, mister.');
			if (err.toString().includes('timeout setting')) message.channel.send('That website is too powerful! It\'s taken me more than 30 seconds to render, so I\'m canceling. Sorry!');
			client.processing.splice(index, 1);
			sent = true;
			return;
		}

		message.channel.send({embed: new Discord.RichEmbed()
			.setTitle(`Render of ${args[0].length > 245 ? args[0].slice(0, -(args[0].length - 245)) : args[0]}`)
			.setDescription(`Website can be found [here](${ args[0].startsWith('https://') || args[0].startsWith('http://') ? args[0] : 'https://' + args[0] })\nI am not responsible for the content of this website.`)
			.attachFile(`../media/temp/${date}-${message.author.id}.png`)
			.setImage(`attachment://${date}-${message.author.id}.png`)
			.setFooter(`Requested by ${message.author.tag}`)
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