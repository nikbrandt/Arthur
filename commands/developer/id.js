exports.run = async (message, args, suffix, client, permLevel) => {
	if (!args[0]) return message.channel.send('How am I going to get the ID of no one? Ey?');

	let user;
	if (permLevel === 10) user = client.users.cache.find(u => u.tag === suffix)
		|| client.users.cache.find(u => u.tag.toLowerCase().includes(suffix.toLowerCase()))
		|| (await client.shard.broadcastEval(`this.users.cache.find(u => u.tag.toLowerCase().includes("${suffix.toLowerCase().replace(/"/g, '')}"))`)).filter(item => !!item)[0];
	else user = message.guild.members.cache.find(m => m.user.tag.toLowerCase() === suffix.toLowerCase()) || message.guild.members.cache.find(m => m.user.tag.toLowerCase().includes(suffix.toLowerCase()));

	if (!user) return message.channel.send(message.__('user_does_not_exist'));

	message.channel.send({embed: {
		title: user.id,
		footer: {
			text: message.__('id_of', { name: user.username })
		}
	}});
};

exports.config = {
	enabled: true,
	permLevel: 1,
	perms: [ 'EMBED_LINKS' ],
	category: 'developer'
};