exports.run = (message, a, s, d, permLevel) => {
	if (!message.member.roles.cache.find(r => r.name.toLowerCase() === i18n.get('struct.music.dj', message).toLowerCase()) && !message.member.roles.find(r => r.name.toLowerCase() === i18n.get('struct.music.music', message).toLowerCase()) && permLevel < 3) return message.react(':missingpermissions:407054344874229760').catch(() => {});
	if (!message.guild.music || !message.guild.music.queue) return message.channel.send(message.__('nothing_playing'));

	if (message.guild.music.playing === true) return message.channel.send(message.__('already_playing'));

	message.guild.voice.connection.dispatcher.resume();
	message.guild.music.playing = true;
	message.channel.send(message.__('resumed'));
};

exports.config = {
	enabled: true,
	permLevel: 2,
	category: 'music'
};