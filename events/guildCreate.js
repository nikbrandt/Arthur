const defaultChannel = require('../functions/defaultChannel');
const { post } = require('../functions/dbots');

module.exports = (client, guild) => {
	let channel = defaultChannel(guild);

	if (channel && channel.permissionsFor(guild.me).has('SEND_MESSAGES')) channel.send('Aye! My name\'s Arthur, one of those multipurpose bots who does things. \nThanks for adding me to your guild. A couple notable features of mine would be `webshot`, which takes pictures of websites, `mp3` which downloads a YouTube video as mp3, a well made leveling system (toggled with `levels`), and a pretty good music system (queue all sorts of things with `play`). \nMy prefix is currently `a.`. \nFor more help, do `a.help`.\nIf you have any problems, feel free to join the support server (in the help commmand).\nSuggest new features with `a.suggest`\nBy using this bot, you agree to the short TOS available at http://bit.ly/ArthurTOS\n\n\nEnjoy!');

	client.channels.get('326587514494124053').send({embed: {
		author: {
			name: `Added to ${guild.name}`,
			icon_url: guild.iconURL
		},
		color: 0x00c140,
		description: `Owner is ${guild.owner.user.tag} (${guild.ownerID})\nHas ${guild.memberCount} members\nID is ${guild.id}`,
		footer: {
			text: `Now in ${client.guilds.size} guilds.`
		}
	}});

	setTimeout(() => {
		post(client);
	}, 1000);
};