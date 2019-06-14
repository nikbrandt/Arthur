const request = require('request');
const webshot = require('webshot');
const Discord = require('discord.js');
const moment = require('moment');
const fs = require('fs');

function failed (messageOptions, msg, client, index) {
	msg.edit('', messageOptions);
	client.processing.splice(index, 1);
}

exports.run = async (message, args, s, client) => {
	const failedEmbed = {
		title: message.__('failed.title'),
		description: message.__('failed.description'),
		color: 0xff9335,
		footer: {
			text: message.__('failed.footer')
		}
	};
	
	if (!args[0]) return message.channel.send(message.__('no_args'));
	let index = client.processing.length;
	client.processing.push(moment().format('h:mm:ss A') + ' - MC Server/Webshot');
	let msg = await message.channel.send(message.__('processing'));

	request(`https://use.gameapis.net/mc/query/info/${args[0]}`, (err, response, body) => {
		if (!body || body.startsWith('<html')) return failed({embed: failedEmbed}, msg, client, index);

		let json = JSON.parse(body);
		let date = Date.now();
		let num = Math.floor(Math.random() * 10000);

		if (!json.status) return failed({embed: failedEmbed}, msg, client, index);

		webshot(json.motds.html.replace('\n', '<br>'), `../media/temp/${num}-${date}.png`, {siteType: 'html', windowSize: { width: 700, height: 85 }, customCSS: '@font-face{font-family:Minecraftia;src:url(../media/fonts/Minecraftia-Regular.ttf) format(\'truetype\')}*{font-size:24px;font-family:Minecraftia}'}, err => {
			const embed = new Discord.RichEmbed()
				.setAuthor(message.__('embed.title', { hostname: json.hostname }), `https://use.gameapis.net/mc/query/icon/${args[0]}`)
				.setFooter(message.__('embed.footer', { port: json.port, ping: json.ping, protocol: json.protocol }))
				.addField(message.__('embed.players'), `${json.players.online}/${json.players.max}`, true)
				.addField(message.__('embed.version'), json.version.replace(/§./g, ''), true)
				.setColor(0x00c140);
			
			if (err) {
				console.log('mcserver command error while rendering webshot - rip\n', err);
				embed.setDescription('```\n' + json.motds.clean + '```');
			} else {
				embed.attachFile(`../media/temp/${num}-${date}.png`)
					.setImage(`attachment://${num}-${date}.png`);
			}

			message.channel.send({embed}).then(() => {
				msg.delete().catch(() => {});
				try {
					client.processing.splice(index, 1);
					fs.unlinkSync(`../media/temp/${num}-${date}.png`);
				} catch (e) {}
			});
		})
	});
};

exports.config = {
	enabled: false,
	permLevel: 1,
	aliases: [ 'mcs', 'server', 'minecraftserver' ],
	perms: [ 'EMBED_LINKS', 'ATTACH_FILES' ]
};

exports.help = {
	name: 'Minecraft Server',
	description: 'Get information about a Minecraft server',
	usage: 'mcserver <server IP>',
	help: 'Get information such as players and MOTD from a Minecraft server.',
	category: 'APIs'
};
