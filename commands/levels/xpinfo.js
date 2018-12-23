const sql = require('sqlite');

exports.run = async (message, ar, sui, client) => {
	let levels = await sql.get(`SELECT levels FROM guildOptions WHERE guildID = '${message.guild.id}'`);
	levels = !(!levels || levels.levels === 'false');

	message.channel.send({embed: {
		color: 0x8356ff,
		fields: [
			{
				name: message.__('leveling_system'),
				value: message.__('description', { levels: levels ? message.__('enabled') : message.__('disabled'), prefix: client.config.prefix })
			},
			{
				name: message.__('current_settings'),
				value: message.__('settings_message', { base: client.config.xp.base, min: client.config.xp.base - client.config.xp.min, max: client.config.xp.base + client.config.xp.max, seconds: client.config.xp.xpAdd / 1000, levelOne: client.config.xp.levelOne, mult: client.config.xp.mult, maxMult: client.config.xp.maxMult })
			}
		]
	}});
};

exports.config = {
	enabled: true,
	permLevel: 2,
	perms: ['EMBED_LINKS']
};