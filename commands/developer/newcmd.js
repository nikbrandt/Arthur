const Discord = require('discord.js');
const fs = require('fs');
const prefixes = ['default', 'dev', 'mod', 'admin'];
const part1 = 'exports.run = (message, args, suffix, client, perms) => {\n	';
const pDefault = '\n};\n\nexports.config = {\n	enabled: true,\n	permLevel: 2,\n	aliases: []\n};';
const pDev = '\n};\n\nexports.config = {\n	enabled: true,\n	permLevel: 10,\n	aliases: []\n};';
const pMod = '\n};\n\nexports.config = {\n	enabled: true,\n	permLevel: 3,\n	aliases: []\n};';
const pAdmin = '\n};\n\nexports.config = {\n	enabled: true,\n	permLevel: 4,\n	aliases: []\n};';

exports.run = (message, args, suffix, client) => {
	if (!client.config.owners.includes(message.author.id)) return;
	if (!args[0]) return message.channel.send('Tell me the name of the command you want to create.');
	if (!args[1]) return message.channel.send(`Please one of the following prefixes: ${prefixes.join(', ')}`);
	if (!prefixes.includes(args[1])) return message.channel.send(`Please one of the following prefixes: ${prefixes.join(', ')}`);
	if (fs.existsSync(`./commands/${args[0]}.js`)) return message.channel.send(`A command named ${args[0]} already exists.`);
	
	const egg = `\n\nexports.help = {\n	name: '${args[0]}',\n	description: 'An easter egg based off ${args[0]}',\n	usage: '${args[0]}',\n	help: 'An easter egg based off ${args[0]}',\n	category: 'Eggs'\n};`;
	const baseEmbed = new Discord.RichEmbed()
		.setColor(0x42f4b0)
		.setAuthor(args[0], 'https://cdn2.iconfinder.com/data/icons/nodejs-1/512/nodejs-512.png')
		.setDescription(`What would you like to set ${args[0]} as?`)
		.setFooter('Command will be canceled in 10 minutes.');
	
	message.channel.send({embed: baseEmbed});
	message.channel.awaitMessages(m => m.author.id == message.author.id, {max: 1, time: 600000, errors: ['time']}).then(collected => {
		let colMsg = collected.first();
		if (colMsg.content == 'cancel') return message.channel.send('Canceled.');
		fs.writeFile(`${__dirname}/../${args[0]}.js`, part1 + colMsg.content + args[1] == 'default' ? pDefault : args[1] == 'dev' ? pDev : args[1] == 'mod' ? pMod : args[1] == 'admin' ? pAdmin : pDefault + args[2] == 'egg' ? egg : '', err => {
			if (err) message.channel.send({embed: baseEmbed.setDescription(`There was an error creating the file: \n${err}`).setColor(0xf45c42).setFooter('').setTitle('')});
			else {
				setTimeout(() => {
					try {
						let command = require(`${__dirname}/../${args[0]}.js`);
						client.commands.set(args[0].split('/')[args[0].split('/').length - 1], command);
					} catch (er) {
						return message.channel.send({embed: baseEmbed.setDescription(`There was an error loading the file: \n${er}`).setColor(0xf45c42).setFooter('').setTitle('')});
					}
					message.channel.send({embed: baseEmbed.setTitle(`Success! ${args[0]}.js has been created.`).setDescription('').setColor(0x57fc41).setFooter(':D')});
				}, 500);
			}
		});
	}).catch(col => {
		message.channel.send({embed: baseEmbed.setDescription('Command canceled.').setFooter('')});
	});
};

exports.config = {
	enabled: true,
	permLevel: 10,
	aliases: []
};

exports.help = {
	name: 'Create Command',
	description: 'Make a new command for Arthur.',
	usage: 'newcmd <name>',
	help: 'You make a new command, or really a file, for Arthur. Don\'t do this without having run, config, and help ready.',
	category: 'Developer'
};