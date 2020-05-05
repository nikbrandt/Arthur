exports.run = (message, a, s, d, permLevel) => {
	if (!message.member.roles.cache.find(r => r.name.toLowerCase() === i18n.get('struct.music.dj', message).toLowerCase()) && !message.member.roles.cache.find(r => r.name.toLowerCase() === i18n.get('struct.music.music', message).toLowerCase()) && permLevel < 3) return message.react(':missingpermissions:407054344874229760').catch(() => {});
	if (!message.guild.music || !message.guild.music.queue || !message.guild.voice || !message.guild.voice.connection) return message.channel.send(message.__('no_music_playing'));

	if (message.guild.music.playing === false) return message.channel.send(message.__('already_paused'));

	message.guild.voice.connection.dispatcher.pause(true);
	message.guild.music.playing = false;
	message.guild.music.pauseTime = Date.now();
	message.channel.send(message.__('paused'));
};

exports.config = {
	enabled: true,
	permLevel: 2,
	category: 'music'
};