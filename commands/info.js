const Discord = require('discord.js');
const moment = require('moment');

exports.run = async (message, args, asdf, client) => {
	const invite = await client.generateInvite(client.config.info.invitePerms);

	let locale = i18n.getLocaleCode(message);
	if (locale === 'en-US') locale = 'en';

	message.channel.send({embed: {
		author: {
			name: message.__('title'),
			icon_url: 'https://cdn.discordapp.com/attachments/219218693928910848/361405047608705025/arthur_but_hot.png'
		},
		description: `${message.__('description')}\n [${i18n.get('commands.help.large_embed.invite', message)}](${invite}) | [GitHub](https://github.com/Gymnophoria/Arthur) | [${i18n.get('commands.help.large_embed.support_server', message)}](${client.config.info.guildLink}) | [Trello](https://trello.com/b/wt7ptHpC/arthur) | [${i18n.get('commands.help.large_embed.tos', message)}](https://docs.google.com/document/d/1kbGlTbG-SDcO5AiN2mWbhJNr7AyOZi26n3Nt9duI95w/edit?usp=sharing)`,
		color: 0x00c140,
		fields: [
			{
				name: message.__('author'),
				value: client.owner.tag,
				inline: true
			},
			{
				name: message.__('help'),
				value: '@Arthur ' + i18n.get('commands.help.meta.command', message),
				inline: true
			},
			{
				name: message.__('info'),
				value: message.__('info_value', {
					nodeVersion: process.version,
					discordVersion: Discord.version,
					uptime: moment.duration(process.uptime() * 1000).locale(locale).humanize(),
					shard: client.shard.id,
					managerUptime: moment.duration(Date.now() - client.shard.uptimeStart).locale(locale).humanize()
				})
			}
		]
	}});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	perms: ['EMBED_LINKS'],
	category: 'other'
};