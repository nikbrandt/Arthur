exports.run = async (message, args, suffix, client) => {
	let invite = await client.generateInvite(client.config.info.invitePerms);

	message.channel.send({embed: {
		description: message.__('description', { invite }),
		color: 0x00c140
	}})
};

exports.config = {
	enabled: true,
	permLevel: 1,
	perms: ['EMBED_LINKS']
};