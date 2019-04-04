const sql = require('sqlite');

exports.run = async (message, args, suffix, client) => {
	let users = await sql.all(`SELECT userID FROM guildUserBlacklist WHERE guildID = '${message.guild.id}'`);
	users = users.map(u => u.userID);

	if (!args[0]) return message.channel.send(message.__('no_args'));
	let obj = client.findMember(message, suffix);
	if (!obj) return message.channel.send(i18n.get('commands.blacklist.invalid_user', message));
	if (obj.user.id === message.author.id) return message.channel.send(message.__('self_blacklist'));
	if (!users.includes(obj.user.id)) return message.channel.send(message.__('not_blacklisted'));

	sql.run(`DELETE FROM guildUserBlacklist WHERE userID = '${obj.user.id}' AND guildID = '${message.guild.id}'`);
	message.channel.send(message.__('unblacklisted', { tag: obj.user.tag }));
};

exports.config = {
	enabled: true,
	permLevel: 3,
	category: 'server_management'
};