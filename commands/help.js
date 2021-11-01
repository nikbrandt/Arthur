const permLevel = require('../functions/permLevel');

const forEach = function (obj, loop) {
  let a = Object.keys(obj);
  for (let i = 0; i < a.length; i++) {
    loop(obj[a[i]], a[i]);
  }
};

exports.run = async (message, args, suffix, client, perms, prefix) => {
	if (!args[0] || args[0] === 'dev' || args[0] === 'eggs' || args[0] === message.__('chat_flag')) {
		let commands = client.commands.filter(c => c.config.permLevel <= (perms === 1 ? 2 : perms));
		let categories = {};
		let fields = [];
		commands.forEach((com, name) => {
			let meta;
			if (com.config.category === 'sound_effects') {
				meta = {
					command: name,
					name: name.substring(0, 1).toUpperCase() + name.substring(1),
					description: message.__('sound_effects.description', { name })
				}
			} else try {
				meta = i18n.getMeta(name, message) || com.meta;
			} catch (e) {
				if (e.toString() !== `en-US locale missing string commands.${name}.meta`) client.errorLog('Error getting meta for command while generating help'. e);
			}
			if (!meta) return;

			if (args[0] === 'dev' && client.config.owners.includes(message.author.id) && com.config.category !== 'developer') return;
			else if (args[0] === 'eggs' && client.config.owners.includes(message.author.id) && com.config.category !== 'eggs') return;
			else if (com.config.category === 'developer' || com.config.category === 'eggs') return;

			if (!categories.hasOwnProperty(com.config.category)) categories[com.config.category] = [];
			categories[com.config.category].push(`**${prefix}${meta.command}** \u203a ${meta.description}`);
		});

		forEach(categories, (coms, cat) => {
			fields.push({
				name: message.__(`categories.${cat}`),
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
			description: `[${message.__('large_embed.invite')}](${invite}) | [GitHub](https://github.com/nikbrandt/Arthur) | [${message.__('large_embed.support_server')}](${client.config.info.guildLink}) | [Trello](https://trello.com/b/wt7ptHpC/arthur) | [${message.__('large_embed.tos')}](https://docs.google.com/document/d/1kbGlTbG-SDcO5AiN2mWbhJNr7AyOZi26n3Nt9duI95w/edit?usp=sharing)\n${message.__('large_embed.description')}`,
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
		let name = i18n.getCommandFileName(args[0], message) || args[0];
		let command = client.commands.get(name);
		if (!command) return message.channel.send(message.__('invalid_command', { command: args[0] }));

		let meta;

		if (command.config.category === 'sound_effects') {
			meta = {
				name: name.substring(0, 1).toUpperCase() + name.substring(1),
				help: message.__('sound_effects.help', { name })
			}
		} else try {
			meta = i18n.getMeta(name, message) || command.meta;
		} catch (e) {
			if (e !== `en-US locale missing string commands.${name}.meta`) client.errorLog('Error getting individual command meta for help command display', e);
		}

		if (!meta) return message.channel.send(message.__('invalid_command', { command: args[0] }));

		message.channel.send({embed: {
			color: 0x00c140,
			fields: [
				{
					name: meta.name,
					value: `${meta.help}\n${message.__('small_embed.usage')} \`${prefix}${name}${meta.usage ? " " + meta.usage : ""}\`${meta.aliases && meta.aliases.length > 0 ? `\n${message.__('small_embed.aliases')} ${meta.aliases.join(', ')}` : ''}`,
					inline: true
				},
				{
					name: message.__('small_embed.advanced'),
					value: `${command.config.cooldown ? '**' + Math.round(command.config.cooldown / 1000) + i18n.get('time.abbreviations.seconds', message) + '** ' + message.__('small_embed.cooldown') + '\n' : ''}${command.config.guildCooldown ? '**' + Math.round(command.config.guildCooldown / 1000) + i18n.get('time.abbreviations.seconds', message) + '** ' + message.__('small_embed.server_cooldown') + '\n' : ''}${i18n.get(`perm_levels.${command.config.permLevel}`, message)}\n${command.config.perms ? message.__('small_embed.requires_bot_perms') + i18n.getPermsString(command.config.perms, message) + '\n' : ''}${command.config.userPerms ? message.__('small_embed.requires_member_perms') + i18n.getPermsString(command.config.userPerms, message) : ''}`,
					inline: true
				}
			],
			footer: {text: message.__('small_embed.footer', { category: message.__(`categories.${command.config.category}`) }) }
		}});
	}
};

exports.config = {
	enabled: true,
	permLevel: 1,
	perms: ['EMBED_LINKS'],
	category: 'other'
};