const request = require('request');
const { MessageEmbed } = require('discord.js');
const moment = require('moment');
const captureWebsite = require('capture-website');

const dataRegex = /^data:image\/([a-z]+);base64,/;
const { errorLog } = require('../../functions/eventLoader');

const customCSS = `
@font-face { font-family: 'Minecraftia'; src: url('../media/fonts/Minecraft-Regular.ttf') format('truetype'); font-weight: normal; font-style: normal; }
@font-face { font-family: 'Minecraftia'; src: url('../media/fonts/Minecraft-Italic.ttf') format('truetype'); font-weight: normal; font-style: italic; }
@font-face { font-family: 'Minecraftia'; src: url('../media/fonts/Minecraft-Bold.ttf') format('truetype'); font-weight: bold; font-style: normal; }
@font-face { font-family: 'Minecraftia'; src: url('../media/fonts/Minecraft-BoldItalic.ttf') format('truetype'); font-weight: bold; font-style: italic; }
* { font-size: 30px; font-family: Minecraftia, Minecraft, sans-serif }
:not(span) { color: #AAAAAA }
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

	request(`https://api.mcsrvstat.us/2/${args[0]}`, async (err, response, body) => {
		if (err || !body) return failed({embed: failedEmbed}, msg, client, index);

		try {
			body = JSON.parse(body);
		} catch (e) {
			return failed({ embed: failedEmbed }, msg, client, index);
		}

		if (!body.online) return failed({embed: failedEmbed}, msg, client, index);

		let fileLocation = `../media/temp/${message.id}.png`;
		let html = body.motd.html.join('<br>').replace(/ {2}/g, '&nbsp;&nbsp;');

		let captureError = false;

		captureWebsite.file(html, fileLocation, { inputType: 'html', width: 700, height: 85, styles: [ customCSS ], defaultBackground: false }).catch(error => {
			captureError = error;
		}).then(() => {
			let iconBase64 = body.icon;
			let iconFilename;
			let files = [];

			if (iconBase64) {
				iconFilename = 'icon.' + iconBase64.match(dataRegex)[1];
				iconBase64 = iconBase64.replace(dataRegex, '');
				let iconBuffer = Buffer.from(iconBase64, 'base64');
				files.push({ attachment: iconBuffer, name: iconFilename });
			}

			const embed = new MessageEmbed()
				.setAuthor(message.__('embed.title', { hostname: args[0].indexOf(':') > -1 ? args[0].substring(0, args[0].indexOf(':')) : args[0] }), (iconFilename ? `attachment://${iconFilename}` : undefined))
				.setFooter(message.__('embed.footer', { port: body.port, protocol: body.protocol }))
				.addField(message.__('embed.players'), `${body.players.online}/${body.players.max}`, true)
				.addField(message.__('embed.version'), body.version.replace(/§./g, ''), true)
				.setColor(0x00c140);

			if (captureError) {
				errorLog('mcserver command failed while getting webshot', captureError);
				embed.setDescription('```\n' + body.motd.clean.join('\n') + '```');
			} else {
				files.push({ attachment: fileLocation, name: 'motd.png' });

				embed.setImage(`attachment://motd.png`);
			}

			embed.attachFiles(files);

			message.channel.send({embed}).then(() => {
				msg.delete().catch(() => {});
			}).then(() => {
				client.processing.splice(index, 1);
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
