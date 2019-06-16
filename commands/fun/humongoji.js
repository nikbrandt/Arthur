const sql = require('sqlite');

exports.run = async message => {
	let row = await sql.get(`SELECT humongoji FROM guildOptions WHERE guildID = '${message.guild.id}'`);

	if (!row) {
		sql.run(`INSERT INTO guildOptions (guildID, levels) VALUES (?, ?)`, [message.guild.id, 'true']);
		return message.channel.send('Humongojis have been enabled for this server. Enjoy.');
	}

	if (row.humongoji === 'true') {
		sql.run(`UPDATE guildOptions SET humongoji = 'false' WHERE guildID = '${message.guild.id}'`);
		message.channel.send('As sad as it is for the users of your server, humongojis have been disabled. Riperoni.');
	} else {
		sql.run(`UPDATE guildOptions SET humongoji = 'true' WHERE guildID = '${message.guild.id}'`);
		message.channel.send('Humongojis have been enabled for this server. Enjoy.'); // when doing i18n, this is the same text as line 8
	}
};

exports.config = {
	enabled: true,
	permLevel: 5,
	aliases: [ 'wumbowumboji', 'bigmoji', 'hugemoji' ]
};

exports.help = {
	name: 'Toggle Humongoji',
	description: 'Enable or disable humongojis in a guild. They\'re wumbojis, but better.',
	usage: 'levels',
	help: 'Wumbojis are bigger emojis that appear when an emoji is in a message by itself. See the [changelog](https://blog.discordapp.com/2016-4-29-change-log-a6451dfbaac8) for when they were added.\n' +
	'Humongojis (this feature) are even *bigger* emojis that will appear in the same scenario, where Arthur will show the emoji image in full glorious HD.\n' +
	'If Arthur has the MANAGE_MESSAGES permission, the original message will also be deleted.\n' +
	'Humongojis are disabled by default.',
	category: 'Server Management'
};