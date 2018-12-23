const permLevel = require('../functions/permLevel');

const forEach = function (obj, loop) {
  let a = Object.keys(obj);
  for (let i = 0; i < a.length; i++) {
    loop(obj[a[i]], a[i]);
  }
};

exports.run = async (message, args, suffix, client, perms, prefix) => {
	if (!args[0] || args[0] === 'dev' || args[0] === 'eggs' || args[0] === message.__('chat_flag')) {
		let commands = client.commands.filter(c => c.config.permLevel <= perms === 1 ? 2 : perms);
		let categories = {};
		let fields = [];
		commands.forEach((com, name) => {
			if (args[0] === 'dev' && client.config.owners.includes(message.author.id) ? com.help.category !== 'Developer' : args[0] === 'eggs' && client.config.owners.includes(message.author.id) ? com.help.category !== 'Eggs' : com.help.category === 'Developer' || com.help.category === 'Eggs' || !com.help.category) return;
			if (!categories.hasOwnProperty(com.help.category)) categories[com.help.category] = [];
			categories[com.help.category].push(`\u200b	${prefix}${name} - ${com.help.description}`);
		});
		forEach(categories, (coms, cat) => {
			fields.push({
				name: cat,
				value: coms.join('\n'),
				inline: true
			});
		});

		const invite = await client.generateInvite(client.config.info.invitePerms);
		let embed = {
			color: 0x00c140,
			author: {
				name: message.__('arthur_help'),
				icon_url: 'https://cdn.discordapp.com/attachments/219218693928910848/361405047608705025/arthur_but_hot.png'
			},
			description: `[${message.__('large_embed.invite')}](${invite}) | [GitHub](https://github.com/Gymnophoria/Arthur) | [${message.__('large_embed.support_server')}](${client.config.info.guildLink}) | [Trello](https://trello.com/b/wt7ptHpC/arthur) | [${message.__('large_embed.tos')}](https://docs.google.com/document/d/1kbGlTbG-SDcO5AiN2mWbhJNr7AyOZi26n3Nt9duI95w/edit?usp=sharing)\n${message.__('large_embed.description')}`,
			fields,
			footer: {
				text: message.__('large_embed.footer', { prefix })
			}
		};

		if (message.guild) {
			if (args[0] === message.__('chat_flag')) message.channel.send({embed});
			else {
				let msg = await message.channel.send(message.__('check_dms'));
				message.author.send({embed}).catch(() => {
					if (msg) msg.edit(message.__('send_failed', { prefix }));
				});
			}
		} else message.author.send({embed}).catch(() => {});
	} else {
		let command = client.commands.get(args[0]) || client.commands.get(client.aliases.get(args[0]));
		if (!command) return message.channel.send(message.__('invalid_command', { command: args[0] }));
		
		message.channel.send({embed: {
			color: 0x00c140,
			fields: [
				{
					name: command.help.name,
					value: `${command.help.help}\n${message.__('small_embed.usage')} \`${prefix}${command.help.usage}\`${command.config.aliases && command.config.aliases.length > 0 ? `\n${message.__('small_embed.aliases')} ${command.config.aliases.join(', ')}` : ''}`,
					inline: true
				},
				{
					name: message.__('small_embed.advanced'),
					value: `${command.config.cooldown ? '**' + Math.round(command.config.cooldown / 1000) + i18n.get('time.abbreviations.seconds', message) + '** ' + message.__('small_embed.cooldown') + '\n' : ''}${command.config.guildCooldown ? '**' + Math.round(command.config.guildCooldown / 1000) + i18n.get('time.abbreviations.seconds', message) + '** ' + message.__('small_embed.server_cooldown') + '\n' : ''}${permLevel.numMapping[command.config.permLevel]}\n${command.config.perms ? message.__('small_embed.requires_bot_perms') + command.config.perms.join(', ').toLowerCase() + '\n' : ''}${command.config.userPerms ? message.__('small_embed.requires_member_perms') + command.config.userPerms.join(', ').toLowerCase() : ''}`,
					inline: true
				}
			],
			footer: {text: message.__('small_embed.footer', { category: command.help.category }) }
		}});
	}
};

exports.config = {
	enabled: true,
	permLevel: 1,
	perms: ['EMBED_LINKS']
};