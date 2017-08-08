exports.run = (message, ar, sui, client) => {
	message.channel.send({embed: {
		color: 0x8356ff,
		fields: [
			{
				name: 'Leveling System',
				value: `Arthur has a leveling system that will give you XP and eventually level you up while you type messages. This is ${!!client.guildTable[message.guild.id] ? client.guildTable[message.guild.id].levels ? 'enabled' : 'disabled' : 'disabled'} for this guild, but can be toggled by a server manager with \`${client.config.prefix}leveling\``
			},
			{
				name: 'Current Settings',
				value: `XP revolves around **${client.config.xp.base}**, for a range of **${client.config.xp.base - client.config.xp.min}** to **${client.config.xp.base + client.config.xp.max}** XP per message.
XP is added every **${client.config.xp.xpAdd / 1000}** seconds.
To achieve level 1, you need **${client.config.xp.levelOne}** XP.
Each level requires **${client.config.xp.eqMult}**x as much XP as the previous.
The maximum XP will be multiplied for activity is **${client.config.xp.maxMult}x**`
			}
		]
	}});
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['xi', 'xpi']
};

exports.help = {
	name: 'XP Info',
	description: 'Gives information about Arthur\'s leveling system.',
	usage: 'xpinfo',
	help: 'Receive information on Arthur\'s leveling system, including whether or not it is disabled in the current guild and its current settings.',
	category: 'Leveling and Profiles'
};