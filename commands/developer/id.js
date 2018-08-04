exports.run = (message, args, suffix, client, permLevel) => {
	if (!args[0]) return message.channel.send('How am I going to get the ID of no one? Ey?');

	let user;
	if (permLevel === 10) user = client.users.find('tag', suffix) || client.users.find(u => u.tag.toLowerCase().includes(suffix.toLowerCase()));
	else user = message.guild.members.find(m => m.user.tag.toLowerCase() === suffix.toLowerCase()) || message.guild.members.find(m => m.user.tag.toLowerCase().includes(suffix.toLowerCase()));

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
	aliases: [],
	perms: [ 'EMBED_LINKS' ]
};

exports.help = {
	name: 'ID',
	description: 'Get a user\'s Discord Snowflake ID',
	usage: 'id <partial or full Discord tag>',
	help: 'Get a user\'s Discord Snowflake ID.',
	category: 'Developer'
};