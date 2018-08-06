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
	aliases: ['inv'],
	perms: ['EMBED_LINKS']
};

exports.help = {
	name: 'Invite',
	description: 'Invite Arthur to your server.',
	usage: 'invite',
	help: 'Get an invite link for Arthur.',
	category: 'Other'
};