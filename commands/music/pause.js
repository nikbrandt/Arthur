exports.run = (message, a, s, d, permLevel) => {
	if (!message.member.roles.cache.find(r => r.name.toLowerCase() === i18n.get('struct.music.dj', message).toLowerCase()) && !message.member.roles.find(r => r.name.toLowerCase() === i18n.get('struct.music.music', message).toLowerCase()) && permLevel < 3) return message.react(':missingpermissions:407054344874229760').catch(() => {});
	if (!message.guild.music || !message.guild.music.queue) return message.channel.send(message.__('no_music_playing'));

	if (message.guild.music.playing === false) return message.channel.send(message.__('already_paused'));

	message.guild.voiceConnection.dispatcher.pause(true);
	message.guild.music.playing = false;
	message.channel.send(message.__('paused'));
};

exports.config = {
	enabled: true,
	permLevel: 2,
	category: 'music'
};