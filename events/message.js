const config = require('../../media/config.json');
const XP = require('../struct/xp.js');
const sql = require('sqlite');

let cooldownObj = {};

module.exports = async (client, message) => {
	if (message.author.bot) return;
	if (message.guild && !message.channel.permissionsFor(message.guild.me).has('SEND_MESSAGES')) return;
	
	if (message.author.melon === true) message.react('🍉').catch();

	let prefix;

	if (message.guild) {
		let row = await sql.get(`SELECT prefix, levels FROM guildOptions WHERE guildID = '${message.guild.id}'`);
		XP.addXP(message, row).catch(console.error);
		if (!row) prefix = config.prefix;
		else prefix = row.prefix;
	} else prefix = 'a.';
	
	if (!message.content.startsWith(prefix) && !message.content.startsWith(`<@${client.user.id}>`) && !message.content.startsWith(`<@!${client.user.id}>`)) return;
	
	let args = message.content.split(' ');
	if (!message.content.startsWith(prefix)) args = args.slice(1);
	const command = args[0].slice(message.content.startsWith(prefix) ? prefix.length : 0).toLowerCase();
	
	args = args.slice(1);
	const suffix = args.join(' ');
	const perms = client.permLevel(message);
	const cmdFile = client.commands.get(command) || client.commands.get(client.aliases.get(command));

	if (!cmdFile) return;

	let go = true;
	let userGo = true;
	let missingPerms = [];

	if (cmdFile.config.perms && message.guild) {
		cmdFile.config.perms.forEach(p => {
			if (!message.channel.permissionsFor(message.guild.me).has(p)) {
				go = false;
				missingPerms.push(p.toLowerCase())
			}
		});
	}

	if (cmdFile.config.userPerms && message.guild) {
		cmdFile.config.userPerms.forEach(p => {
			if (!message.channel.permissionsFor(message.guild.me).has(p)) userGo = false;
		})
	}

	if (!go) return message.channel.send(`I lack the permission(s) needed to run this command: ${missingPerms.join(', ')}`);
	if (!userGo) return;

	if (cmdFile.config.cooldown && cooldownObj[message.author.id] && cooldownObj[message.author.id][cmdFile.help.name] && Date.now() - cooldownObj[message.author.id][cmdFile.help.name] < cmdFile.config.cooldown) return message.channel.send(`Whoah there, you\'re being too spicy for me. Could you just chill? Wait another ${Math.round((cooldownObj[message.author.id][cmdFile.help.name] + cmdFile.config.cooldown - Date.now()) / 1000)} seconds, would ya?`);
	if (cmdFile.config.cooldown) {
		if (cooldownObj[message.author.id]) cooldownObj[message.author.id][cmdFile.help.name] = Date.now();
		else cooldownObj[message.author.id] = { [cmdFile.help.name]: Date.now() };
	}

	if (cmdFile.config.guildCooldown && cooldownObj[message.guild.id] && cooldownObj[message.guild.id][cmdFile.help.name] && Date.now() - cooldownObj[message.guild.id][cmdFile.help.name] < cmdFile.config.guildCooldown) return message.channel.send(`Dude, this guild is just being way too spicy. Some people need to seriously chill.. Wait another ${Math.round((cooldownObj[message.guild.id][cmdFile.help.name] + cmdFile.config.guildCooldown - Date.now()) / 1000)} seconds, would ya?`);
	if (cmdFile.config.guildCooldown) {
		if (cooldownObj[message.guild.id]) cooldownObj[message.guild.id][cmdFile.help.name] = Date.now();
		else cooldownObj[message.guild.id] = { [cmdFile.help.name]: Date.now() };
	}

	if (cmdFile.config.enabled && cmdFile.config.permLevel <= perms) {
		try {
			cmdFile.run(message, args, suffix, client, perms);
		} catch (err) {
			console.error(`Command ${command} has failed to run!\n${err.stack}`);
		}
	}
};