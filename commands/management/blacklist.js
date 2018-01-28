const sql = require('sqlite');

exports.run = async (message, args, suffix, client) => {
	let users = await sql.all(`SELECT userID FROM guildUserBlacklist WHERE guildID = '${message.guild.id}'`);
	users = users.map(o => o.userID);

	if (!args[0]) {
		let members = users.map(u => message.guild.member(u));
		let memberList = members.map(mem => mem.user.username === mem.displayName ? mem.user.tag : `${mem.user.tag} (${mem.displayName})`).join('\n');

		message.channel.send({embed: {
			title: 'Blacklisted Users',
			description: memberList ? memberList : 'Nothin\' to display here, carry on.',
			color: 0xed3636
		}});
	} else {
		let obj = client.findMember(message, suffix);
		if (!obj) return message.channel.send('Did you make that person up in your imagination? They don\'t exist. You can\'t blacklist people that aren\'t here. It just doesn\'t work.');
		if (obj.user.id === message.author.id) return message.channel.send('Hey. I\'m not blacklisting you from me. Thanks, but no thanks.');
		if (users.includes(obj.user.id)) return message.channel.send('This person is already blacklisted.\nGo ahead and run `unblacklist <their name>` if you don\'t want them blacklisted anymore. Thanks.');

		sql.run(`INSERT INTO guildUserBlacklist (guildID, userID) VALUES (?, ?)`, [ message.guild.id, obj.user.id ]);
		message.channel.send(`**${obj.user.tag}** has been blacklisted from usage of Arthur. Riperoni in pepperoni.\nShould you want to unblacklist them, run \`unblacklist ${obj.user.id}\`.\nHave a good day. :thumbsup:`)
	}
};

exports.config = {
	enabled: true,
	permLevel: 3,
	aliases: ['bl']
};

exports.help = {
	name: 'Blacklist User',
	description: 'Blacklist a user from using Arthur in your server.',
	usage: 'blacklist <user resolvable>',
	help: 'Blacklist a user from using Arthur on your server. Give me a user ID, mention, or tag (username#0000).\nArthur will not interact with this user in any way, other than like.. notice that they\'re in a voice channel',
	category: 'Server Management'
};