const request = require('request');
const webshot = require('webshot');
const Discord = require('discord.js');
const moment = require('moment');
const fs = require('fs');

const failedEmbed = {
	title: 'Server offline or invalid.',
	description: 'Sorry ¯\\_(ツ)_/¯',
	color: 0xff9335,
	footer: {
		text: 'If the server is actually online, try setting enable-query to true in server.properties.'
	}
};

function failed (messageOptions, msg, client, index) {
	msg.edit('', messageOptions);
	client.processing.splice(index, 1);
}

exports.run = async (message, args, s, client) => {
	if (!args[0]) return message.channel.send('Please tell me which server to query.');
	let index = client.processing.length;
	client.processing.push(moment().format('h:mm:ss A') + ' - MC Server/Webshot');
	let msg = await message.channel.send('Processing..');

	request(`https://use.gameapis.net/mc/query/info/${args[0]}`, (err, response, body) => {
		if (!body || body.startsWith('<html')) return failed({embed: failedEmbed}, msg, client, index);

		let json = JSON.parse(body);
		let date = Date.now();
		let num = Math.floor(Math.random() * 10000);

		if (!json.status) return failed({embed: failedEmbed}, msg, client, index);

		webshot(json.motds.html.replace('\n', '<br>'), `../media/temp/${num}-${date}.png`, {siteType: 'html', windowSize: { width: 700, height: 85 }, customCSS: '@font-face{font-family:Minecraftia;src:url(../media/fonts/Minecraftia-Regular.ttf) format(\'truetype\')}*{font-size:24px;font-family:Minecraftia}'}, err => {
			if (err) console.log('mcserver command error while rendering webshot - rip\n', err);

			const embed = new Discord.RichEmbed()
				.setAuthor(`${json.hostname} is online.`, `https://use.gameapis.net/mc/query/icon/${args[0]}`)
				.setFooter(`Port ${json.port} | ${json.ping} Ping | Protocol ${json.protocol}`)
				.addField('Players', `${json.players.online}/${json.players.max}`, true)
				.addField('Version', json.version.replace(/§./g, ''), true)
				.setColor(0x00c140)
				.attachFile(`../media/temp/${num}-${date}.png`)
				.setImage(`attachment://${num}-${date}.png`);

			message.channel.send({embed}).then(() => {
				msg.delete();
				fs.unlinkSync(`../media/temp/${num}-${date}.png`);
			});
		})
	});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	aliases: ['mcs', 'server', 'minecraftserver']
};

exports.help = {
	name: 'Minecraft Server',
	description: 'Get information about a Minecraft server',
	usage: 'mcserver <server IP>',
	help: 'Get information such as players and MOTD from a Minecraft server.',
	category: 'APIs'
};