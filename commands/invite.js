exports.run = async (message, args, suffix, client) => {
	let invite = await client.generateInvite(client.config.info.invitePerms);

	message.channel.send({embed: {
		description: `Arthur can be invited with [this link](${invite}). You need to have Manage Server or Admin permission to add the bot to a server.`,
		color: 0x00c140
	}})
};

exports.config = {
	enabled: true,
	permLevel: 1,
	aliases: ['inv']
};

exports.help = {
	name: 'Invite',
	description: 'Invite Arthur to your server.',
	usage: 'invite',
	help: 'Get an invite link for Arthur.',
	category: 'Other'
};