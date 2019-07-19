const request = require('request');
const webshot = require('webshot');
const { RichEmbed } = require('discord.js');
const moment = require('moment');
const fs = require('fs');

const dataRegex = /^data:image\/([a-z]+);base64,/;
const { errorLog } = require('../../functions/eventLoader');

const customCSS = `
@font-face { font-family: 'Minecraftia'; src: url('../media/fonts/Minecraft-Regular.ttf') format('truetype'); font-weight: normal; font-style: normal; }
@font-face { font-family: 'Minecraftia'; src: url('../media/fonts/Minecraft-Italic.ttf') format('truetype'); font-weight: normal; font-style: italic; }
@font-face { font-family: 'Minecraftia'; src: url('../media/fonts/Minecraft-Bold.ttf') format('truetype'); font-weight: bold; font-style: normal; }
@font-face { font-family: 'Minecraftia'; src: url('../media/fonts/Minecraft-BoldItalic.ttf') format('truetype'); font-weight: bold; font-style: italic; }
* { font-size: 24px; font-family: Minecraftia, Minecraft, sans-serif }
`;

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
	
	let indexOfColon = args[0].indexOf(':');
	let port = '';
	let domain = args[0];
	if (indexOfColon >= 0) {
		port = `/${args[0].substring(indexOfColon + 1)}`;
		domain = args[0].substring(0, indexOfColon);
	}
	
	request(`https://api.mcsrvstat.us/2/${domain}${port}`, (err, response, body) => {
		if (err || !body) return failed({embed: failedEmbed}, msg, client, index);
		
		try {
			body = JSON.parse(body);
		} catch (e) {
			return failed({ embed: failedEmbed }, msg, client, index);
		}

		if (!body.online) return failed({embed: failedEmbed}, msg, client, index);
		
		let fileLocation = `../media/temp/${message.id}.png`;
		let html = body.motd.html.join('<br>').replace(/ {2}/g, '&nbsp;&nbsp;');

		webshot(html, fileLocation, {siteType: 'html', windowSize: { width: 700, height: 85 }, customCSS }, err => {
			let iconBase64 = body.icon;
			let iconFilename = 'icon.' + iconBase64.match(dataRegex)[1];
			iconBase64 = iconBase64.replace(dataRegex, '');
			let iconBuffer = Buffer.from(iconBase64, 'base64');
			
			let files = [ { attachment: iconBuffer, name: iconFilename } ];
			
			const embed = new RichEmbed()
				.setAuthor(message.__('embed.title', { hostname: body.hostname }), `attachment://${iconFilename}`)
				.setFooter(message.__('embed.footer', { port: body.port, protocol: body.protocol }))
				.addField(message.__('embed.players'), `${body.players.online}/${body.players.max}`, true)
				.addField(message.__('embed.version'), body.version.replace(/§./g, ''), true)
				.setColor(0x00c140);
			
			if (err) {
				console.log('mcserver command error while rendering webshot - rip\n', err);
				errorLog('mcserver command failed while getting webshot', err.stack, err.code);
				embed.setDescription('```\n' + body.motd.clean.join('\n') + '```');
			} else {
				files.push({ attachment: fileLocation, name: 'motd.png' });
				
				embed.setImage(`attachment://motd.png`);
			}
			
			embed.attachFiles(files);

			message.channel.send({embed}).then(() => {
				msg.delete().catch(() => {});
				try {
					client.processing.splice(index, 1);
					fs.unlinkSync(fileLocation);
				} catch (e) {}
			});
		})
	});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	perms: [ 'EMBED_LINKS', 'ATTACH_FILES' ],
	category: 'apis'
};
