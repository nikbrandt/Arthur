const request = require('request');
const webshot = require('webshot');
const Discord = require('discord.js');
const fs = require('fs');

exports.run = (message, args) => {
	if (!args[0]) return message.channel.send('Please tell me which server to query.');

	request(`https://use.gameapis.net/mc/query/info/${args[0]}`, (err, response, body) => {
		if (err) return message.channel.send('For some reason there was an error. Please contact Gymnophoria#8146.');
		if (!body) return message.channel.send('That server is offline or you gave an invalid URL - rip.');

		let json = JSON.parse(body);
		let date = Date.now();
		let num = Math.floor(Math.random() * 10000);

		if (!json.status) return message.channel.send({embed: {
			title: 'Server offline or invalid.',
			description: 'Sorry ¯\\_(ツ)_/¯',
			color: 0xff9335
		}});

		webshot(json.motds.html.replace('\n', '<br>'), `../media/temp/${num}-${date}.png`, {siteType: 'html', windowSize: { width: 700, height: 85 }, customCSS: '@font-face{font-family:Minecraftia;src:url(../media/fonts/Minecraftia-Regular.ttf) format(\'truetype\')}*{font-size:24px;font-family:Minecraftia}'}, err => {
			if (err) console.log ('error o noes\n', err);

			const embed = new Discord.RichEmbed()
				.setAuthor(`${json.hostname} is online.`, `https://use.gameapis.net/mc/query/icon/${args[0]}`)
				.setFooter(`Port ${json.port} | ${json.ping} Ping | Protocol ${json.protocol}`)
				.addField('Players', `${json.players.online}/${json.players.max}`, true)
				.addField('Version', json.version.replace(/§./g, ''), true)
				.setColor(0x00c140)
				.attachFile(`../media/temp/${num}-${date}.png`)
				.setImage(`attachment://${num}-${date}.png`);

			message.channel.send({embed}).then(() => {
				fs.unlinkSync(`../media/temp/${num}-${date}.png`);
			});
		})
	});
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['mcs', 'server', 'minecraftserver']
};

exports.help = {
	name: 'Minecraft Server',
	description: 'Get information about a Minecraft server',
	usage: 'mcserver <server IP>',
	help: 'Get information such as players and MOTD from a Minecraft server.',
	category: 'APIs'
};