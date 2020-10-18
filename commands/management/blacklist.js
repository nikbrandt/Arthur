function findRole(message, search) {
	let rolesCache = message.guild.roles.cache;
	let role;

	if (message.mentions.roles.size) role = message.mentions.roles.find(role => role.name !== '@everyone');

	if (!role) role = rolesCache.get(search);
	if (!role) role = rolesCache.find(role => role.name.toLowerCase() === search.toLowerCase());
	if (!role) role = rolesCache.find(role => role.name.toLowerCase().includes(search.toLowerCase()));

	return role;
}

exports.run = async (message, args, suffix, client) => {
	if (!args[0]) return message.channel.send(message.__('no_args'));

	let blacklist = await client.getGuildBlacklist(message.guild.id);

	let role = false;
	let obj = client.findMember(message, suffix);

	if (!obj) {
		obj = findRole(message, suffix);
		role = true;
	}

	if (!obj) return message.channel.send(message.__('invalid'));
	if (!role) obj = obj.user;

	if (!role && obj.id === message.author.id) return message.channel.send(message.__('self_blacklist'));
	if (role && message.member.roles.cache.has(obj.id)) return message.channel.send(message.__('self_role_blacklist'));
	if (blacklist.includes(obj.id)) return message.channel.send(message.__('already_blacklisted', { id: obj.id }));

	sql.run(`INSERT INTO guildBlacklist (guildID, ID) VALUES (?, ?)`, [ message.guild.id, obj.id ]);
	blacklist.push(obj.id);

	message.channel.send(message.__('blacklisted', { tag: role ? obj.name : obj.tag, id: obj.id }));
};

exports.findRole = findRole;

exports.config = {
	enabled: true,
	permLevel: 3,
	category: 'server_management'
};