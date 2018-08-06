const defaultChannel = require('../functions/defaultChannel');
const { post } = require('../functions/dbots');

module.exports = (client, guild) => {
	let channel = defaultChannel(guild);

	if (channel && channel.permissionsFor(guild.me).has('SEND_MESSAGES')) channel.send('Aye! My name\'s Arthur, one of those multipurpose bots who does things.\nThanks for adding me to your server\nMy prefix is currently `a.`, change it with the `prefix` command.\nTo change the server\'s language, use `serverlanguage`, and to change your own, use `language`. (If you know a non-English language, help translate! Ask in the support server.)\nFor more help, do `a.help`.\nIf you have any problems, feel free to join the support server (in the help commmand).\nBy using this bot, you agree to the short TOS available at http://bit.ly/ArthurTOS\n\nEnjoy!').catch(() => {});

	client.channels.get('326587514494124053').send({embed: {
		author: {
			name: `${guild.name}`,
			icon_url: guild.iconURL
		},
		color: 0x00c140,
		description: `${guild.memberCount} members`,
		footer: {
			text: `${client.guilds.size} guilds`
		}
	}});

	setTimeout(() => {
		post(client);
	}, 1000);
};