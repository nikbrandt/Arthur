const defaultChannel = require('../functions/defaultChannel');
const { post } = require('../functions/dbots');
const sql = require('sqlite');

module.exports = (client, guild) => {
	// check for existence of guild settings in sql
	sql.get(`SELECT guildID FROM guildOptions WHERE guildID = '${guild.id}'`).then(row => {
		if (!!row) return; // if there are guild settings, don't send message

		// create guild settings with default values
		sql.run(`INSERT INTO guildOptions (guildID) VALUES (?)`, [guild.id]).then(() => {
			let channel = defaultChannel(guild);

			if (channel && channel.permissionsFor(guild.me).has('SEND_MESSAGES')) channel.send(
				'Aye! My name\'s Arthur, one of those multipurpose bots who does things.\n' +
				'Thanks for adding me to your server\nMy prefix is currently `a.`, change it with the `prefix` command.\n' +
				'To change the server\'s language, use `serverlanguage`, and to change your own, use `language`. (If you know a non-English language, help translate! Ask in the support server.)\n' +
				'For more help, use `a.help`.\n' +
				'If you have any problems, feel free to join the support server (in the help commmand).\n' +
				'By using this bot, you agree to the short TOS available at http://bit.ly/ArthurTOS\n\n' +
				'Enjoy!'
			).catch(() => {});
		})
	});

	setTimeout(() => {
		post(client);
	}, 1000);
};
