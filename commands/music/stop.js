exports.run = (message, a, s, d, permLevel) => {
	if (!message.member.roles.cache.find(r => r.name.toLowerCase() === i18n.get('struct.music.dj', message).toLowerCase())
		&& !message.member.roles.cache.find(r => r.name.toLowerCase() === i18n.get('struct.music.music', message).toLowerCase())
		&& permLevel < 3
		&& ((!message.guild.music || !message.guild.music.queue) ? true : message.guild.music.queue.find(item => item.requester !== message.author.id) || message.guild.voice.connection.channel.members.size > 2)) return message.react(':missingpermissions:407054344874229760').catch(() => {});

	if (!message.guild.music || !message.guild.music.queue) return message.channel.send(message.__('no_music'));

	message.channel.send(message.__('stopped', { user: message.member.displayName.replace(/@/g, '@\u200b').replace(/ /g, '') }));
	if (message.guild.voice && message.guild.voice.connection) message.guild.voice.connection.disconnect();
	message.guild.music = {};
};

exports.config = {
	enabled: true,
	permLevel: 2,
	category: 'music'
};