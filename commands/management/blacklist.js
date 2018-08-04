const sql = require('sqlite');

exports.run = async (message, args, suffix, client) => {
	let users = await sql.all(`SELECT userID FROM guildUserBlacklist WHERE guildID = '${message.guild.id}'`);
	users = users.map(o => o.userID);

	if (!args[0]) {
		let members = users.map(u => message.guild.member(u));
		let memberList = members.map(mem => mem.user.username === mem.displayName ? mem.user.tag : `${mem.user.tag} (${mem.displayName})`).join('\n');

		message.channel.send({embed: {
			title: message.__('blacklisted_users'),
			description: memberList ? memberList : message.__('nothing_to_display'),
			color: 0xed3636
		}});
	} else {
		let obj = client.findMember(message, suffix);
		if (!obj) return message.channel.send(message.__('invalid_user'));
		if (obj.user.id === message.author.id) return message.channel.send(message.__('self_blacklist'));
		if (users.includes(obj.user.id)) return message.channel.send(message.__('already_blacklisted', { id: obj.user.id }));

		sql.run(`INSERT INTO guildUserBlacklist (guildID, userID) VALUES (?, ?)`, [ message.guild.id, obj.user.id ]);
		message.channel.send(message.__('blacklisted', { tag: obj.user.tag, id: obj.user.id }));
	}
};

exports.config = {
	enabled: true,
	permLevel: 3,
	aliases: ['bl']
};

exports.help = {
	name: 'Blacklist User',
	description: 'Blacklist a user from using Arthur in your server.',
	usage: 'blacklist <user resolvable>',
	help: 'Blacklist a user from using Arthur on your server. Give me a user ID, mention, or tag (username#0000).\nArthur will not interact with this user in any way, other than like.. notice that they\'re in a voice channel',
	category: 'Server Management'
};