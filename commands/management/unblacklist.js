const { findRole } = require('./blacklist');

exports.run = async (message, args, suffix, client) => {
	let blacklist = await client.getGuildBlacklist(message.guild.id);

	if (!args[0]) return message.channel.send(message.__('no_args'));

	let role = false;
	let obj = client.findMember(message, suffix);

	if (!obj) {
		obj = findRole(message, suffix);
		role = true;
	}

	if (!obj) return message.channel.send(i18n.get('commands.blacklist.invalid_user', message));
	if (!role) obj = obj.user;

	if (!blacklist.includes(obj.id)) return message.channel.send(message.__('not_blacklisted'));

	sql.run(`DELETE FROM guildBlacklist WHERE ID = '${obj.id}' AND guildID = '${message.guild.id}'`);
	blacklist.splice(blacklist.indexOf(obj.id), 1);

	message.channel.send(message.__('unblacklisted', { tag: role ? obj.name : obj.tag }));
};

exports.config = {
	enabled: true,
	permLevel: 3,
	category: 'server_management'
};