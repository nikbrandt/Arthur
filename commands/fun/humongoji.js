exports.run = async message => {
	let row = await sql.get(`SELECT humongoji FROM guildOptions WHERE guildID = '${message.guild.id}'`);

	if (!row) {
		sql.run(`INSERT INTO guildOptions (guildID, humongoji) VALUES (?, ?)`, [message.guild.id, 'true']);
		return message.channel.send(message.__('enabled'));
	}

	if (row.humongoji === 'true') {
		sql.run(`UPDATE guildOptions SET humongoji = 'false' WHERE guildID = '${message.guild.id}'`);
		message.channel.send(message.__('disabled'));
	} else {
		sql.run(`UPDATE guildOptions SET humongoji = 'true' WHERE guildID = '${message.guild.id}'`);
		message.channel.send(message.__('enabled'));
	}
};

exports.config = {
	enabled: true,
	permLevel: 5,
	category: 'server_management'
};
