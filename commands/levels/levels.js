const sql = require('sqlite');

exports.run = async message => {
	let row = await sql.get(`SELECT * FROM guildOptions WHERE guildID = '${message.guild.id}'`);

	if (!row) {
		sql.run(`INSERT INTO guildOptions (guildID, levels) VALUES (?, ?)`, [message.guild.id, 'true']);
		return message.channel.send('Leveling has been enabled.');
	}

	if (row.levels === 'true') {
		sql.run(`UPDATE guildOptions SET levels = 'false' WHERE guildID = '${message.guild.id}'`);
		message.channel.send('Leveling has been disabled.');
	} else {
		sql.run(`UPDATE guildOptions SET levels = 'true' WHERE guildID = '${message.guild.id}'`);
		message.channel.send('Leveling has been enabled.');
	}
};

exports.config = {
	enabled: true,
	permLevel: 5,
	aliases: ['leveling']
};

exports.help = {
	name: 'Leveling Toggle',
	description: 'Enable or disable leveling for a guild.',
	usage: 'levels',
	help: 'Simply a toggle for leveling on a guild, including all leveling commands. Leveling is disabled by default.',
	category: 'Server Management'
};