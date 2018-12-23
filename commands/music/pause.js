exports.run = (message, a, s, d, permLevel) => {
	if (!message.member.roles.find(r => r.name.toLowerCase() === 'dj') && !message.member.roles.find(r => r.name.toLowerCase() === 'music') && permLevel < 3) return message.react(':missingpermissions:407054344874229760').catch(() => {});
	if (!message.guild.music || !message.guild.music.queue) return message.channel.send(message.__('no_music_playing'));

	if (message.guild.music.playing === false) return message.channel.send(message.__('already_paused'));

	message.guild.voiceConnection.dispatcher.pause();
	message.guild.music.playing = false;
	message.channel.send(message.__('paused'));
};

exports.config = {
	enabled: true,
	permLevel: 2
};