module.exports = guild => {
	let textChannels = guild.channels.cache.filter(g => g.type === 'GUILD_TEXT');
	if (textChannels.size < 1) return undefined;

	return textChannels.find(c => c.name === 'general') ||
		textChannels.get(guild.id) ||
		textChannels.first();
};
