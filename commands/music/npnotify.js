exports.run = async (message) => { // npNotify column
	let row = await sql.get(`SELECT npNotify FROM guildOptions WHERE guildID = '${message.guild.id}'`);

	if (!row) {
		row = 'false';
		await sql.run(`INSERT INTO guildOptions (guildID) VALUES (?)`, [ message.guild.id ]);
	} else row = row.npNotify;

	if (row === 'false') {
		message.channel.send(message.__('message', { status: message.__('enabled') }));
		row = 'true';
	} else {
		message.channel.send(message.__('message', { status: message.__('disabled') }));
		row = 'false';
	}

	sql.run(`UPDATE guildOptions SET npNotify = '${row}' WHERE guildID = '${message.guild.id}'`);
};

exports.config = {
	enabled: true,
	permLevel: 3,
	category: 'music'
};