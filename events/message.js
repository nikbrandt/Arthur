const config = require('../../media/config.json');
const moment = require('moment');
const XP = require('../struct/xp.js');
const sql = require('sqlite');

let cooldownObj = {};

module.exports = async (client, message) => {
	if (message.author.bot) return;
	if (message.guild && !message.channel.permissionsFor(message.guild.me).has('SEND_MESSAGES')) return;
	
	if (message.author.melon === true) message.react('🍉').catch();

	let prefix;

	if (client.test) prefix = config.testPrefix;
	else if (message.guild) {
		let row = await sql.get(`SELECT prefix, levels FROM guildOptions WHERE guildID = '${message.guild.id}'`);
		 XP.addXP(message, row).catch(console.error);
		if (row) prefix = row.prefix;
		else prefix = config.prefix;
	} else prefix = config.prefix;
	
	if (!message.content.startsWith(prefix) && !message.content.startsWith(`<@${client.user.id}>`) && !message.content.startsWith(`<@!${client.user.id}>`)) {
		if (message.channel.type !== 'text') client.channels.get('304441662724243457').send({embed: {
			author: {
				name: `Message from ${message.author.tag}`,
				icon_url: message.author.displayAvatarURL
			},
			color: 0x418cf4,
			description: message.content
		}});

		if (message.content.includes(`<@${client.user.id}>`) || message.content.includes(`<@!${client.user.id}>`)) client.channels.get('304441662724243457').send({embed: {
			author: {
				name: `Mention from ${message.author.tag}`,
				icon_url: message.author.displayAvatarURL
			},
			color: 0x418cf4,
			description: message.content
		}});

		return;
	}
	
	let args = message.content.split(/\s+/g);
	if (!message.content.startsWith(prefix)) args = args.slice(1);
	if (!args[0]) return;
	const command = args[0].slice(message.content.startsWith(prefix) ? prefix.length : 0).toLowerCase();

	const suffix = message.content.slice(args[0].length + 1);
	args = args.slice(1);
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
			cmdFile.run(message, args, suffix, client, perms, prefix);
		} catch (err) {
			console.error(`Command ${command} has failed to run!\n${err.stack}`);
		}

		if (message.author.id !== client.owner.id) {
			let actualCommand = client.aliases.get(command) || command;

			let stats = { date: Date.now(), user: message.author.id || undefined, guild: message.guild.id || 'pms'};
			if (!client.commandStatsObject[actualCommand]) client.commandStatsObject[actualCommand] = { uses: 1, usesArray: [ stats ] };
			else {
				client.commandStatsObject[actualCommand].usesArray.push(stats);
				client.commandStatsObject[actualCommand].uses++;
			}

			let weekAndYear = moment().format('W/YYYY');
			let date = moment().format('M/D/YYYY');

			if (!client.dailyStatsObject[date]) client.dailyStatsObject[date] = {};
			if (!client.dailyStatsObject[date][actualCommand]) client.dailyStatsObject[date][actualCommand] = 1;
			else client.dailyStatsObject[date][actualCommand]++;

			if (!client.weeklyStatsObject[weekAndYear]) client.weeklyStatsObject[weekAndYear] = {};
			if (!client.weeklyStatsObject[weekAndYear][actualCommand]) client.weeklyStatsObject[weekAndYear][actualCommand] = 1;
			else client.weeklyStatsObject[weekAndYear][actualCommand]++;
		}
	}
};