const defaultChannel = require('../functions/defaultChannel');

module.exports = (client, guild) => {
	let channel = defaultChannel(guild);

	if (channel && channel.permissionsFor(guild.me).has('SEND_MESSAGES')) channel.send('Aye! My name\'s Arthur, one of those multipurpose bots who does things. \nThanks for adding me to your guild. A couple notable features of mine would be `webshot`, which takes pictures of websites, `mp3` which downloads a YouTube video as mp3, and a well made leveling system (toggled with `levels`). \nMy prefix is currently `a.`. \nFor more help, do `a.help`.\nIf you have any problems, feel free to message Gymnophoria#8146.\nEnjoy!');

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
	}})
};