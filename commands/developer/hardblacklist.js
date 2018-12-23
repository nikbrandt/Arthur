const sql = require('sqlite');

exports.run = async (message, args, suffix, client) => {
	if (!args[0]) return message.channel.send('I uh.. I need an ID');
	if (args[0] === message.author.id) return message.channel.send('no, bad');
	
	let user;
	try {
		user = client.users.get(args[0]) || await client.fetchUser(args[0]);
	} catch (e) { 
		user = undefined;
	}
	
	let guild = client.guilds.get(args[0]);
	
	if (!user && !guild) return message.channel.send('Could not find user or guild by that ID. rip');
	
	let deleteEntry = false;
	let result = await sql.get('SELECT * FROM hardBlacklist WHERE id = ?', [ args[0] ]);
	if (result) deleteEntry = true;
	
	if (user) {
		deleteEntry ? await sql.run('DELETE FROM hardBlacklist WHERE id = ?', [ args[0] ]) : await sql.run('INSERT INTO hardBlacklist (id, type) VALUES (?, ?)', [ args[0], 'user' ]);
		message.channel.send(deleteEntry ? `Removed \`${user.tag}\` from blacklist. But did they really learn their lesson?` : `Added \`${user.tag}\` to blacklist. *May they never bother you again*.`);
	}
	
	if (guild) {
		deleteEntry ? await sql.run('DELETE FROM hardBlacklist WHERE id = ?', [ args[0] ]) : await sql.run('INSERT INTO hardBlacklist (id, type) VALUES (?, ?)', [ args[0], 'guild' ]);
		message.channel.send(deleteEntry ? `Guild \`${guild.name}\` removed from blacklist. Anti-uf.` : `Guild \`${guild.name}\` added to blacklist. ***Uf***.`);
	}
};

exports.config = {
	enabled: true,
	permLevel: 9,
};