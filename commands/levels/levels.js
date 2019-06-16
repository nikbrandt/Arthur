const sql = require('sqlite');

exports.run = async message => {
	let row = await sql.get(`SELECT * FROM guildOptions WHERE guildID = '${message.guild.id}'`);

	if (!row) {
		sql.run(`INSERT INTO guildOptions (guildID, levels) VALUES (?, ?)`, [message.guild.id, 'true']);
		return message.channel.send(message.__('leveling_enabled'));
	}

	if (row.levels === 'true') {
		sql.run(`UPDATE guildOptions SET levels = 'false' WHERE guildID = '${message.guild.id}'`);
		message.channel.send(message.__('leveling_disabled'));
	} else {
		sql.run(`UPDATE guildOptions SET levels = 'true' WHERE guildID = '${message.guild.id}'`);
		message.channel.send(message.__('leveling_enabled'));
	}
};

exports.config = {
	enabled: true,
	permLevel: 5,
	category: 'server_management'
};