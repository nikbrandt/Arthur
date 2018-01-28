const sql = require('sqlite');

exports.run = async (message, args, suffix, client, permLevel) => {
	let users = await sql.all(`SELECT userID FROM guildUserBlacklist WHERE guildID = '${message.guild.id}'`);
	users = users.map(u => u.userID);

	if (!args[0]) return message.channel.send('Well? You gonna choose who you want to unblacklist? Or just stand there?');
	let obj = client.findMember(message, suffix);
	if (!obj) return message.channel.send('I could not find the member whom you have tried to find. Could you try again with someone who *exists*?');
	if (obj.user.id === message.author.id) return message.channel.send('You\'re clearly not blacklisted if I\'m talking to you. You alright there, bud?');
	if (!users.includes(obj.user.id)) return message.channel.send('That person isn\'t blacklisted. How nice of you, looking out for those who are doing just fine.');

	sql.run(`DELETE FROM guildUserBlacklist WHERE userID = '${obj.user.id}' AND guildID = '${message.guild.id}'`);
	message.channel.send(`Like magic, **${obj.user.tag}** can interact with me again. :tada:`);
};

exports.config = {
	enabled: true,
	permLevel: 3,
	aliases: ['ubl']
};

exports.help = {
	name: 'Unblacklist',
	description: 'Unblacklist someone previously blacklisted from Arthur.',
	usage: 'unblacklist <user resolvable>',
	help: 'Unblacklist someone previously blacklisted from Arthur. User ID, tag, nickname, whatever.',
	category: 'Server Management'
};