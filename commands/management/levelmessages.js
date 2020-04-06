exports.run = async message => {
	let row = await sql.get(`SELECT levelMessage FROM guildOptions WHERE guildID = '${message.guild.id}'`);

	if (!row) {
		sql.run(`INSERT INTO guildOptions (guildID, levelMessage) VALUES (?, ?)`, [message.guild.id, 'false']);
		return message.channel.send(message.__('enabled'));
	}

	if (row.levelMessage === 'true') {
		sql.run(`UPDATE guildOptions SET levelMessage = 'false' WHERE guildID = '${message.guild.id}'`);
		message.channel.send(message.__('disabled'));
	} else {
		sql.run(`UPDATE guildOptions SET levelMessage = 'true' WHERE guildID = '${message.guild.id}'`);
		message.channel.send(message.__('enabled'));
	}
};

exports.config = {
	enabled: true,
	permLevel: 5,
	category: 'server_management'
};
