const permLevel = require('../functions/permLevel');

const forEach = function (obj, loop) {
  let a = Object.keys(obj);
  for (let i = 0; i < a.length; i++) {
    loop(obj[a[i]], a[i]);
  }
};

exports.run = async (message, args, suffix, client, perms, prefix) => {
	if (!args[0] || args[0] === 'dev' || args[0] === 'eggs' || args[0] === '-chat') {
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
				name: 'Arthur Help',
				icon_url: 'https://cdn.discordapp.com/attachments/219218693928910848/361405047608705025/arthur_but_hot.png'
			},
			description: `[Invite](${invite}) | [GitHub](https://github.com/Gymnophoria/Arthur) | [Support Server](${client.config.info.guildLink}) | [Trello](https://trello.com/b/wt7ptHpC/arthur)\nMade by Gymnophoria#8146\nWhen using commands, <> indicates a required argument and [] indicates an optional requirement. (Do not actually type them)`,
			fields
		};

		if (message.guild) {
			if (args[0] === '-chat') message.channel.send({embed});
			else {
				let msg = await message.channel.send('Check your DM\'s :mailbox_with_mail:');
				message.author.send({embed}).catch(err => {
					if (msg) msg.edit('Message send failed. If you\'d like to see the help in this channel, type `a.help -chat`');
				});
			}
		} else message.author.send({embed}).catch();
	} else {
		let command = client.commands.get(args[0]) || client.commands.get(client.aliases.get(args[0]));
		if (!command) return message.channel.send(`I do not have a \`${args[0]}\` command.`);
		
		message.channel.send({embed: {
			color: 0x00c140,
			fields: [
				{
					name: command.help.name,
					value: `${command.help.help}\n**Usage**: \`${prefix}${command.help.usage}\`${command.config.aliases && command.config.aliases.length > 0 ? `\n**Aliases**: ${command.config.aliases.join(', ')}` : ''}`,
					inline: true
				},
				{
					name: 'Advanced',
					value: `${command.config.cooldown ? '**' + Math.round(command.config.cooldown / 1000) + 's** cooldown\n' : ''}${command.config.guildCooldown ? '**' + Math.round(command.config.guildCooldown / 1000) + 's** server cooldown\n' : ''}${permLevel.numMapping[command.config.permLevel]}\n${command.config.perms ? 'Requires **bot perms**: ' + command.config.perms.join(', ').toLowerCase() + '\n' : ''}${command.config.userPerms ? 'Requires additional **member perms**: ' + command.config.userPerms.join(', ').toLowerCase() : ''}`,
					inline: true
				}
			],
			footer: {text: 'Category: ' + command.help.category + ' | <> is required, [] is optional'}
		}});
	}
};

exports.config = {
	enabled: true,
	permLevel: 1,
	aliases: ['h', 'halp', 'commands']
};

exports.help = {
	name: 'Help',
	description: 'View the help menu.',
	usage: 'help [command]',
	help: 'View the entire help menu or just help for one command.',
	category: 'Other'
};