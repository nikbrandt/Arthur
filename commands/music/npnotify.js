const sql = require('sqlite');

exports.run = async (message) => { // npNotify column
	let row = await sql.get(`SELECT npNotify FROM guildOptions WHERE guildID = '${message.guild.id}'`);

	if (!row) row = 'false';
	else row = row.npNotify;

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
	aliases: ['npn', 'nowplayingn', 'nowplayingnotify', 'npnotify']
};

exports.help = {
	name: 'Now Playing Notify',
	description: 'Send a message when a new song starts',
	usage: 'nowplayingnotify',
	help: 'Send a message in the chat where `a.play` was used last showing the currently playing song at the beginning of each song. Toggle with this command or `a.nowplaying notify`.',
	category: 'Music'
};