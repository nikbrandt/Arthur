exports.run = (message, a, s, c, permLevel) => {
	if (!message.guild.music || !message.guild.music.queue) return message.channel.send(message.__('no_music_playing'));
	if (!message.member.roles.find(r => r.name.toLowerCase() === i18n.get('struct.music.dj', message).toLowerCase()) && !message.member.roles.find(r => r.name.toLowerCase() === i18n.get('struct.music.music', message).toLowerCase() && message.guild.music.queue[0].person.id !== message.author.id) && permLevel < 3) return message.channel.send(message.__('no_permissions'));

	let cleanName = message.member.displayName.replace(/@/g, '@\u200b').replace(/ /g, '');
	
	if (message.guild.music.loop) {
		message.guild.music.loop = false;
		message.channel.send(message.__('off', { name: cleanName }));
	} else {
		message.guild.music.loop = true;
		message.channel.send(message.__('on', { name: cleanName }));
	}
};

exports.config = {
	enabled: true,
	permLevel: 2,
	category: 'music'
};