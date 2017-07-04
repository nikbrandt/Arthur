const forEach = function (obj, loop) {
  let a = Object.keys(obj);
  for (let i = 0; i < a.length; i++) {
    loop(obj[a[i]], a[i]);
  }
  return;
};

exports.run = (message, args, suffix, client, perms) => {
	if (!args[0] || args[0] == 'dev' || args[0] == 'eggs') {
		let commands = client.commands.filter(c => c.config.permLevel <= perms === 1 ? 2 : perms);
		let categories = {};
		let fields = [];
		commands.forEach((com, name) => {
			if (args[0] == 'dev' && client.config.owners.includes(message.author.id) ? com.help.category !== 'Developer' : args[0] == 'eggs' && client.config.owners.includes(message.author.id) ? com.help.category !== 'Eggs' : com.help.category === 'Developer' || com.help.category === 'Eggs' || !com.help.category) return;
			if (!categories.hasOwnProperty(com.help.category)) categories[com.help.category] = [];
			categories[com.help.category].push(`\u200b	${client.config.prefix}${name} - ${com.help.description}`);
		});
		forEach(categories, (coms, cat) => {
			fields.push({
				name: cat,
				value: coms.join('\n'),
				inline: true
			});
		});
		
		message.channel.send({embed: {
			color: 0x00c140,
			author: {
				name: 'Arthur Help',
				icon_url: client.user.avatarURL
			},
			description: 'invite link here | github here | guild here | owner here\nWhen using commands, <> indicates a required argument and [] indicates an optional requirement.',
			fields
		}});
	} else {
		let command = client.commands.get(args[0]) || client.commands.get(client.aliases.get(args[0]));
		if (!command) return message.channel.send(`I do not have a \`${args[0]}\` command.`);
		
		message.channel.send({embed: {
			color: 0x00c140,
			title: command.help.name,
			description: `${command.help.help}\n**Usage**: \`${client.config.prefix}${command.help.usage}\`${command.config.aliases && command.config.aliases.length > 1 ? `\n**Aliases**: ${command.config.aliases.join(', ')}` : ''}`,
			footer: {text: 'Category: ' + command.help.category}
		}});
	}
};

exports.config = {
	enabled: true,
	permLevel: 1,
	aliases: ['h', 'halp']
};

exports.help = {
	name: 'Help',
	description: 'View the help menu.',
	usage: 'help [command]',
	help: 'View the entire help menu or just help for one command.',
	category: 'Other'
};