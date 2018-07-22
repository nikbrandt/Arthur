const config = require('../../media/config.json');
const moment = require('moment');
const XP = require('../struct/xp.js');
const sql = require('sqlite');

let cooldownObj = {};

module.exports = async (client, message) => {
	if (message.author.bot) return;
	if (message.guild && message.channel.permissionsFor(message.guild.me) && !message.channel.permissionsFor(message.guild.me).has('SEND_MESSAGES')) return;

	if (message.guild) {
		let blacklisted = await sql.get(`SELECT count(1) FROM guildUserBlacklist WHERE userID = '${message.author.id}' AND guildID = '${message.guild.id}'`);
		if (!!blacklisted['count(1)']) return;
	}
	
	if (message.author.melon === true) message.react('🍉').catch(() => {});

	let prefix;

	if (client.test) prefix = config.testPrefix;
	else if (message.guild) {
		let row = await sql.get(`SELECT prefix, levels FROM guildOptions WHERE guildID = '${message.guild.id}'`);
		XP.addXP(message, row).catch(console.error);
		if (row) prefix = row.prefix;
		else prefix = config.prefix;
	} else prefix = config.prefix;

	prefix = prefix.toLowerCase();
	
	if (!message.content.toLowerCase().startsWith(prefix) && !message.content.startsWith(`<@${client.user.id}>`) && !message.content.startsWith(`<@!${client.user.id}>`)) {
		if (message.channel.type !== 'text') {
			if (/^[^ ]*help$/i.test(message.content)) return message.channel.send('My prefix is `a.`; do `a.help` for help.');

			let authorID;

			if (client.recentMessages[message.author.id]) authorID = client.recentMessages[message.author.id];
			else {
				authorID = client.lastRecentMessageID + 1;
				client.recentMessages[message.author.id] = authorID.toString();
				client.lastRecentMessageID += 1;
			}

			client.channels.get(config.messageLogChannel).send(
				{
					embed: {
						author: {
							name: `Message from ${message.author.tag} | ID ${authorID}`,
							icon_url: message.author.displayAvatarURL
						},
						color: 0x418cf4,
						description: message.content
					},
					files: message.attachments.array().map(a => a ? a.url : '')
				}
			);

			client.lastMessage = message.author;
		}

		if (message.content.includes(`<@${client.user.id}>`) || message.content.includes(`<@!${client.user.id}>`)) {

			let authorID;

			if (client.recentMessages[message.author.id]) authorID = client.recentMessages[message.author.id];
			else {
				authorID = client.lastRecentMessageID + 1;
				client.recentMessages[message.author.id] = authorID.toString();
				client.lastRecentMessageID += 1;
			}

			client.channels.get(config.messageLogChannel).send(
				{
					embed: {
						author: {
							name: `Mention from ${message.author.tag} | ID ${authorID}`,
							icon_url: message.author.displayAvatarURL
						},
						color: 0x418cf4,
						description: message.content
					},
					files: message.attachments.array().map(a => a ? a.url : '')
				}
			);
			if (message.content.toLowerCase().includes('ship')) message.channel.send('*shipped*', {
				files: ['https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/HMS_BOUNTY_II_with_Full_Sails.jpg/1200px-HMS_BOUNTY_II_with_Full_Sails.jpg']
			})
		}

		return;
	}
	
	let args = message.content.split(/ +/g);
	if (!message.content.toLowerCase().startsWith(prefix)) args = args.slice(1);
	if (!args[0]) return;
	const command = args[0].slice(message.content.toLowerCase().startsWith(prefix) ? prefix.length : 0).toLowerCase();

	const suffix = message.content.slice( args[0].length + ( message.content.toLowerCase().startsWith(prefix) ? 1 : message.guild && message.guild.me.nickname ? 23 : 22 ));
	args = args.slice(1);
	const perms = client.permLevel(message);
	const cmdFile = client.commands.get(command) || client.commands.get(client.aliases.get(command));

	if (!cmdFile) return;
	if (!cmdFile.config.enabled) return message.channel.send('This command is currently disabled. Join the support server for more information.');

	let go = true;
	let userGo = true;
	let missingPerms = [];

	if (cmdFile.config.perms && message.guild) {
		cmdFile.config.perms.forEach(p => {
			if (!message.channel.permissionsFor(message.guild.me) || !message.channel.permissionsFor(message.guild.me).has(p)) {
				go = false;
				missingPerms.push(p.toLowerCase())
			}
		});
	}

	if (cmdFile.config.userPerms && message.guild) {
		cmdFile.config.userPerms.forEach(p => {
			if (!message.channel.permissionsFor(message.member).has(p)) userGo = false;
		})
	}

	if (!go) return message.channel.send(`I lack the permission(s) needed to run this command: ${missingPerms.join(', ')}`);
	if (!userGo) return message.react(':missingpermissions:407054344874229760').catch(() => {});

	if (cmdFile.config.cooldown && cooldownObj[message.author.id] && cooldownObj[message.author.id][cmdFile.help.name] && Date.now() - cooldownObj[message.author.id][cmdFile.help.name] < cmdFile.config.cooldown) return message.channel.send(`Whoah there, you\'re being too spicy for me. Could you just chill? Wait another ${Math.ceil((cooldownObj[message.author.id][cmdFile.help.name] + cmdFile.config.cooldown - Date.now()) / 1000)} second(s), would ya?`);
	if (cmdFile.config.cooldown) {
		if (cooldownObj[message.author.id]) cooldownObj[message.author.id][cmdFile.help.name] = Date.now();
		else cooldownObj[message.author.id] = { [cmdFile.help.name]: Date.now() };
	}

	if (cmdFile.config.guildCooldown && message.guild && cooldownObj[message.guild.id] && cooldownObj[message.guild.id][cmdFile.help.name] && Date.now() - cooldownObj[message.guild.id][cmdFile.help.name] < cmdFile.config.guildCooldown) return message.channel.send(`Dude, this guild is just being way too spicy. Some people need to seriously chill.. Wait another ${Math.ceil((cooldownObj[message.guild.id][cmdFile.help.name] + cmdFile.config.guildCooldown - Date.now()) / 1000)} second(s), would ya?`);
	if (cmdFile.config.guildCooldown && message.guild) {
		if (cooldownObj[message.guild.id]) cooldownObj[message.guild.id][cmdFile.help.name] = Date.now();
		else cooldownObj[message.guild.id] = { [cmdFile.help.name]: Date.now() };
	}

	if (cmdFile.config.permLevel > perms) return message.react(':missingpermissions:407054344874229760').catch(() => {});

	try {
		console.log(`${moment().format('MM-DD H:mm:ss')} - Command ${command} being run.`);
		let resp = cmdFile.run(message, args, suffix, client, perms, prefix);
		if (resp && typeof resp.then === 'function' && typeof resp.catch === 'function') resp.catch(err => {
			console.error(`Command ${command} has failed to run!\n${err.stack}`)
		});
	} catch (err) {
		console.error(`Command ${command} has failed to run!\n${err.stack}`);
	}

	if (message.author.id !== client.owner.id) {
		let actualCommand = client.aliases.get(command) || command;

		if (!client.commandStatsObject[actualCommand]) client.commandStatsObject[actualCommand] = { uses: 1 };
		else client.commandStatsObject[actualCommand].uses++;

		let weekAndYear = moment().format('W/YYYY');
		let date = moment().format('M/D/YYYY');

		if (!client.dailyStatsObject[date]) client.dailyStatsObject[date] = {};
		if (!client.dailyStatsObject[date][actualCommand]) client.dailyStatsObject[date][actualCommand] = 1;
		else client.dailyStatsObject[date][actualCommand]++;

		if (!client.weeklyStatsObject[weekAndYear]) client.weeklyStatsObject[weekAndYear] = {};
		if (!client.weeklyStatsObject[weekAndYear][actualCommand]) client.weeklyStatsObject[weekAndYear][actualCommand] = 1;
		else client.weeklyStatsObject[weekAndYear][actualCommand]++;
	}
};