const sql = require('sqlite');

exports.run = async (message, args, s, c, permLevel) => {
	let row = await sql.get(`SELECT prefix FROM guildOptions WHERE guildID = '${message.guild.id}'`);

	if (!args[0] || permLevel < 4) {
		if (!row) {
			message.channel.send(message.__('current', { prefix: 'a.' }));
			sql.run(`INSERT INTO guildOptions (guildID, prefix) VALUES (?, ?)`, [message.guild.id, 'a.']);
		} else message.channel.send(message.__('current', { prefix: row.prefix }));
	} else {
		if (args[0].length > 10) return message.channel.send(message.__('too_long'));

		message.channel.send(message.__('updated', { prefix: args[0] }));
		if (!row) sql.run(`INSERT INTO guildOptions (guildID, prefix) VALUES (?, ?)`, [message.guild.id, args[0]]);
		else sql.run(`UPDATE guildOptions SET prefix = '${args[0]}' WHERE guildID = '${message.guild.id}'`);
	}
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['setprefix']
};

exports.help = {
	name: 'Prefix',
	description: 'Set or view the server\'s prefix.',
	usage: 'prefix [prefix]',
	help: 'Set or view the server\'s current prefix for the bot.\nYou need **Manage Server** or **Administrator** permission to change the prefix.',
category: 'Server Management'
};