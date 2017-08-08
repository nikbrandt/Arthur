const config = require('../../media/config.json');
const XP = require('../functions/xp.js');

module.exports = message => {
	if (message.author.bot) return;
	const client = message.client;
	if (message.guild && !message.guild.me.permissions.has('SEND_MESSAGES')) return;
	
	if (message.author.melon === true) message.react('🍉').catch();
	if (message.guild) XP.addXP(message).catch(console.error);
	
	if (!message.content.startsWith(config.prefix) && !message.content.startsWith(`<@${client.user.id}>`) && !message.content.startsWith(`<@!${client.user.id}>`)) return;
	
	let args = message.content.split(' ');
	if (!message.content.startsWith(config.prefix)) args = args.slice(1);
	const command = args[0].slice(message.content.startsWith(config.prefix) ? config.prefix.length : 0).toLowerCase();
	
	args = args.slice(1);
	const suffix = args.join(' ');
	const perms = client.permLevel(message);
	const cmdFile = client.commands.get(command) || client.commands.get(client.aliases.get(command));
	
	if (cmdFile && cmdFile.config.enabled &&cmdFile.config.permLevel <= perms) {
		try {
			cmdFile.run(message, args, suffix, client, perms);
		} catch (err) {
			console.error(`Command ${command} has failed to run!\n${err.stack}`);
		}
	}
};