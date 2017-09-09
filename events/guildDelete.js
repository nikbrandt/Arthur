const postGuilds = require('../functions/postGuilds');

module.exports = (client, guild) => {
	client.channels.get('326587514494124053').send({embed: {
		author: {
			name: `Left guild ${guild.name}`,
			icon_url: guild.iconURL
		},
		color: 0xf44242,
		footer: {
			text: `Now in ${client.guilds.size} guilds.`
		}
	}});

	setTimeout(() => {
		postGuilds(client);
	}, 1000);
};