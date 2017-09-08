module.exports = guild => {
	let channel;

	let textChannels = guild.channels.filter(g => g.type === 'text');
	if (textChannels.size < 1) return undefined;

	channel = textChannels.find('name', 'general');
	if (!channel) channel = textChannels.get(guild.id);
	if (!channel) channel = textChannels.first();

	return channel;
};