const config = require('../../media/config.json');
const moment = require('moment');
const XP = require('../struct/xp.js');
const sql = require('sqlite');
const https = require('https');

const { errorLog } = require('../functions/eventLoader');
let cooldownObj = {};

const emojiRegex = /^\s*<?(a)?:?(\w{2,32}):(\d{17,19})>?\s*$/;

module.exports = async (client, message) => {
	if (message.author.bot) return;
	const botPerms = message.guild ? message.channel.permissionsFor(message.guild.me) : null;
	if (message.guild && botPerms && !botPerms.has('SEND_MESSAGES')) return;
	
	let shouldIStayOrShouldIGo = await sql.get('SELECT * FROM hardBlacklist WHERE id = ? OR id = ?', [ message.author.id, message.guild ? message.guild.id : 'xd' ]);
	if (shouldIStayOrShouldIGo && !config.owners.includes(message.author.id)) return;

	if (message.guild) {
		let blacklisted = await sql.get(`SELECT count(1) FROM guildUserBlacklist WHERE userID = '${message.author.id}' AND guildID = '${message.guild.id}'`);
		if (!!blacklisted['count(1)']) return;
	}

	if (message.author.melon === true) message.react('🍉').catch(() => {});

	let prefix;
	let humongoji = false;
	let alexaPlay = false;

	message.__ = (string, variables) => {
		command = i18n.getCommandFileName(command, message) || command;
		return i18n.get('commands.' + command + '.' + string, message, variables);
	};
	
	if (client.test) {
		prefix = config.testPrefix;
		humongoji = false;
	} else if (message.guild) {
		let row = await sql.get(`SELECT prefix, levels, levelMessage, humongoji FROM guildOptions WHERE guildID = '${message.guild.id}'`);
		XP.addXP(message, row).catch(console.error);
		if (row) {
			prefix = row.prefix;
			humongoji = row.humongoji === 'true';
		} else prefix = config.prefix;
	} else prefix = config.prefix;

	prefix = prefix.toLowerCase();

	if (!message.content.toLowerCase().startsWith(prefix) && !message.content.startsWith(`<@${client.user.id}>`) && !message.content.startsWith(`<@!${client.user.id}>`)) {
		if (message.channel.type !== 'text') {
			if (/^[^ ]*help$/i.test(message.content)) return message.channel.send(i18n.get('struct.message.dm_help', message));

			let authorID;

			if (client.recentMessages[message.author.id]) authorID = client.recentMessages[message.author.id];
			else {
				authorID = client.lastRecentMessageID + 1;
				client.recentMessages[message.author.id] = authorID.toString();
				client.lastRecentMessageID += 1;
			}

			client.channels.cache.get(config.messageLogChannel).send(
				{
					embed: {
						author: {
							name: `Message from ${message.author.tag} | ID ${authorID}`,
							icon_url: message.author.displayAvatarURL()
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

			client.channels.cache.get(config.messageLogChannel).send(
				{
					embed: {
						author: {
							name: `Mention from ${message.author.tag} | ID ${authorID}`,
							icon_url: message.author.displayAvatarURL()
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

		if (message.channel.type !== 'text') return;
		
		const extractedEmojis = message.content.match(emojiRegex);
		
		if (humongoji && botPerms.has('ATTACH_FILES') && extractedEmojis) {
			let text = '';
			
			if (botPerms.has('MANAGE_MESSAGES')) text = `\`${extractedEmojis[2]}\` ${i18n.get('commands.nowplaying.by', message).toLowerCase()} \`${message.member.displayName}\``;
			
			let options = {
				method: 'HEAD',
				host: 'cdn.discordapp.com',
				port: 443,
				path: `/emojis/${extractedEmojis[3]}`
			};
			
			let req = https.request(options, res => {
				let filetype = res.headers['content-type'].match(/image\/([a-z]+)/)[1];
				
				message.channel.send(text, { files: [ `https://cdn.discordapp.com/emojis/${extractedEmojis[3]}.${filetype}` ] }).then(() => {
					if (!!text) message.delete().catch(() => {});
				});
			});
			
			req.end();
		}
		
		let alexaStringLower = message.content.toLowerCase();
		let alexaString = Array.from(alexaStringLower);
		alexaString = alexaString.filter(character => character.toLowerCase() !== character.toUpperCase());
		if (!message.guild.name) return;
		if (!message.guild.name.toLowerCase().includes('bots') && !message.guild.name.toLowerCase().includes('listcord') && alexaString.join('').startsWith('thisissosadalexaplay')) alexaPlay = true;
		else return;
	}

	let args = message.content.split(/ +/g);
	if (!message.content.toLowerCase().startsWith(prefix)) args = args.slice(1);
	if (!args[0]) return;
	let command = args[0].slice(message.content.toLowerCase().startsWith(prefix) ? prefix.length : 0).toLowerCase();

	let suffix = message.content.slice( args[0].length + ( message.content.toLowerCase().startsWith(prefix) ? 1 : message.guild && message.guild.me.nickname ? 23 : 22 ));
	args = args.slice(1);

	if (alexaPlay) {
		command = 'play';
		suffix = message.content.slice(message.content.toLowerCase().indexOf('play') + 5);
		args = suffix.split(/ +/g);
	}

	const perms = client.permLevel(message);
	const cmdFile = client.commands.get(i18n.getCommandFileName(command, message)) || client.commands.get(command);

	if (!cmdFile) return;
	if (!cmdFile.config.enabled) return message.channel.send(i18n.get('struct.message.command_disabled', message));

	let go = true;
	let userGo = true;
	let missingPerms = [];

	if (cmdFile.config.perms && message.guild) {
		cmdFile.config.perms.forEach(p => {
			if (!botPerms || !botPerms.has(p)) {
				go = false;
				missingPerms.push(p)
			}
		});
	}

	if (cmdFile.config.userPerms && message.guild) {
		cmdFile.config.userPerms.forEach(p => {
			if (!message.channel.permissionsFor(message.member).has(p)) userGo = false;
		})
	}

	if (!go) return message.channel.send(i18n.get('struct.message.bot_missing_perms', message, { perms: i18n.getPermsString(missingPerms, message) }));
	if (!userGo) return message.react(i18n.get('struct.message.user_missing_perms_emoji', message)).catch(() => {});

	if (cmdFile.config.cooldown && cooldownObj[message.author.id] && cooldownObj[message.author.id][cmdFile] && Date.now() - cooldownObj[message.author.id][cmdFile] < cmdFile.config.cooldown) return message.channel.send(i18n.get('struct.message.user_cooldown', message, { time: Math.ceil((cooldownObj[message.author.id][cmdFile] + cmdFile.config.cooldown - Date.now()) / 1000) }));
	if (cmdFile.config.cooldown && perms < 9) {
		if (cooldownObj[message.author.id]) cooldownObj[message.author.id][cmdFile] = Date.now();
		else cooldownObj[message.author.id] = { [cmdFile]: Date.now() };
	}

	if (cmdFile.config.guildCooldown && message.guild && cooldownObj[message.guild.id] && cooldownObj[message.guild.id][cmdFile] && Date.now() - cooldownObj[message.guild.id][cmdFile] < cmdFile.config.guildCooldown) return message.channel.send(i18n.get('struct.message.guild_cooldown', message, { time: Math.ceil((cooldownObj[message.guild.id][cmdFile] + cmdFile.config.guildCooldown - Date.now()) / 1000) }));
	if (cmdFile.config.guildCooldown && message.guild && perms < 9) {
		if (cooldownObj[message.guild.id]) cooldownObj[message.guild.id][cmdFile] = Date.now();
		else cooldownObj[message.guild.id] = { [cmdFile]: Date.now() };
	}

	if (cmdFile.config.permLevel > perms) return message.react(i18n.get('struct.message.user_missing_perms_emoji', message)).catch(() => {});

	command = i18n.getCommandFileName(command, message) || command;
	
	try {
		console.log(`${moment().format('MM-DD H:mm:ss')} - Command ${command} being run, user id ${message.author.id}${message.guild ? `, guild id ${message.guild.id}` : ''}`);
		let resp = cmdFile.run(message, args, suffix, client, perms, prefix);
		if (resp && typeof resp.then === 'function' && typeof resp.catch === 'function') resp.catch(err => {
			errorLog(`Error while running ${command} | ${err.message}`, err.stack, err.code);
			console.error(`Command ${command} has failed to run!\n${err.stack}`)
		});
	} catch (err) {
		errorLog(`Error while running ${command} | ${err.message}`, err.stack, err.code);
		console.error(`Command ${command} has failed to run!\n${err.stack}`);
	}

	if (message.author.id !== client.owner.id) {
		if (!client.commandStatsObject[command]) client.commandStatsObject[command] = { uses: 1 };
		else client.commandStatsObject[command].uses++;

		let weekAndYear = moment().format('W/YYYY');
		let date = moment().format('M/D/YYYY');

		if (!client.dailyStatsObject[date]) client.dailyStatsObject[date] = {};
		if (!client.dailyStatsObject[date][command]) client.dailyStatsObject[date][command] = 1;
		else client.dailyStatsObject[date][command]++;

		if (!client.weeklyStatsObject[weekAndYear]) client.weeklyStatsObject[weekAndYear] = {};
		if (!client.weeklyStatsObject[weekAndYear][command]) client.weeklyStatsObject[weekAndYear][command] = 1;
		else client.weeklyStatsObject[weekAndYear][command]++;
	}
};
