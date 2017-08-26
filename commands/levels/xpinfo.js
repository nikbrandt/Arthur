const sql = require('sqlite');

exports.run = async (message, ar, sui, client) => {
	let levels = await sql.get(`SELECT levels FROM guildOptions WHERE guildID = '${message.guild.id}'`);
	levels = !(!levels || levels.levels === 'false');

	message.channel.send({embed: {
		color: 0x8356ff,
		fields: [
			{
				name: 'Leveling System',
				value: `Arthur has a leveling system that will give you XP and eventually level you up while you type messages. This is ${levels ? 'enabled' : 'disabled'} for this guild and can be toggled by a server manager with \`${client.config.prefix}leveling\``
			},
			{
				name: 'Current Settings',
				value: `XP revolves around **${client.config.xp.base}**, for a range of **${client.config.xp.base - client.config.xp.min}** to **${client.config.xp.base + client.config.xp.max}** XP per message.
XP is added every **${client.config.xp.xpAdd / 1000}** seconds.
To achieve level 1, you need **${client.config.xp.levelOne}** XP.
Each level requires **${client.config.xp.mult}**x as much XP as the previous.
The maximum XP will be multiplied for activity is **${client.config.xp.maxMult}x**`
			}
		]
	}});
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['xi', 'xpi'],
	perms: ['EMBED_LINKS']
};

exports.help = {
	name: 'XP Info',
	description: 'Gives information about Arthur\'s leveling system.',
	usage: 'xpinfo',
	help: 'Receive information on Arthur\'s leveling system, including whether or not it is disabled in the current guild and its current settings.',
	category: 'Leveling and Profiles'
};