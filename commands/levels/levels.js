exports.run = (message, args, suffix, client) => {
	if (!client.guildTable.has(message.guild.id)) {
		client.guildTable.set(message.guild.id, {levels: true});
		return message.channel.send(`Leveling has been enabled for **${message.guild.name}**.`);
	}
	if (client.guildTable.get(message.guild.id).levels === true) {
		let updatedTable = client.guildTable.get(message.guild.id);
		updatedTable.levels = false;
		client.guildTable.set(message.guild.id, updatedTable);
		return message.channel.send(`Leveling has been disabled for **${message.guild.name}**.`);
	}
	if (client.guildTable.get(message.guild.id).levels === false) {
		let updatedTable = client.guildTable.get(message.guild.id);
		updatedTable.levels = true;
		client.guildTable.set(message.guild.id, updatedTable);
		return message.channel.send(`Leveling has been enabled for **${message.guild.name}**.`);
	}
};

exports.config = {
	enabled: true,
	permLevel: 5,
	aliases: ['leveling']
};

exports.help = {
	name: 'Leveling Toggle',
	description: 'Enable or disable leveling for a guild.',
	usage: 'levels',
	help: 'Simply a toggle for leveling on a guild, including all leveling commands. Leveling is disabled by default.',
	category: 'Server Management'
};