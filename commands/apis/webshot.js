const Discord = require('discord.js');
const captureWebsite = require('capture-website');
const moment = require('moment');
const fs = require('fs');

let nonobad = [ 'data:', 'file://', 'doom3.zoy.org', 'goatse', 'porn', 'redtube', 'sex', 'rule34', 'amateur', 'cuckold', 'creampie', 'cum', 'jiz', 'milf', 'orgasm', 'orgy', 'threesome', 'ass', 'tit', 'dick', 'penis', 'despacito', 'pussy', 'fuck', 'finger', 'bang', 'hentai', 'yaoi', 'virgin', 'handjob', 'blowjob', 'xxx', 'milf' ];

exports.run = async (message, args, s, client) => {
	if (!args[0]) return message.channel.send(message.__('no_args'));
	if (nonobad.some(i => args[0].toLowerCase().includes(i)) && message.author.id !== client.ownerID) return message.channel.send(message.__('blacklisted_website'));
	let index = client.processing.length;
	client.processing.push(moment().format('h:mm:ss A') + ' - Webshot');
	let date = Date.now();
	let sent = false;

	let options = {
		width: 1920,
		height: 1080,
		scaleFactor: 1,
		fullPage: true,
		cookies: [],
		timeout: 30,
		modules: [
			`document.body.innerHTML = document.body.innerHTML.replace(/(?:[0-9]{1,3}\.){3}[0-9]{1,3}/g, ';)')`
		]
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

	let err = false;

	if (!args[0].startsWith('http')) args[0] = 'https://' + args[0];

	captureWebsite.file(args[0], `../media/temp/${date}-${message.author.id}.png`, options).catch(error => {
		err = error;
	}).then(() => {
		if (cancel) return;

		if (err) {
			if (err.toString().includes('value 1')) message.channel.send(message.__('invalid_url'));
			else if (err.toString().includes('timeout setting')) message.channel.send(message.__('timed_out'));
			else if ([ 'ERR_NAME_NOT_RESOLVED', 'ERR_NAME_RESOLUTION_FAILED' ].some(e => err.toString().includes(e))) message.channel.send(message.__('dns_failed'));
			else if (err.toString().includes('ERR_CERT_COMMON_NAME_INVALID')) message.channel.send(message.__('invalid_certificate'));
			else {
				client.errorLog('Unknown webshot error', err);
				message.channel.send(message.__('unknown_error', { err: err.toString() })).catch(() => {
					message.channel.send(message.__('unknown_error', { err: 'Please join Arthur\'s support server for further help.' })).catch(() => {});
				});
			}
			client.processing.splice(index, 1);
			sent = true;
			return;
		}

		message.channel.send({embed: new Discord.MessageEmbed()
			.setTitle(message.__('embed.title', { url: args[0].length > 245 ? args[0].slice(0, -(args[0].length - 245)) : args[0] }))
			.setDescription(message.__('embed.description', { url: args[0].startsWith('https://') || args[0].startsWith('http://') ? args[0] : 'https://' + args[0] }))
			.attachFiles([`../media/temp/${date}-${message.author.id}.png`])
			.setImage(`attachment://${date}-${message.author.id}.png`)
			.setFooter(message.__('embed.footer', { name: message.author.tag }))
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
	perms: ['ATTACH_FILES'],
	cooldown: 10000,
	category: 'other'
};
