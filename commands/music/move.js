function move(array, from, to) {
	array.splice(to, 0, array.splice(from, 1)[0]);
}

exports.run = (message, args, s, c, permLevel) => {
	if (!message.guild.music || !message.guild.music.queue) return message.channel.send(message.__('no_music_playing'));
	if (!message.member.roles.cache.find(r => r.name.toLowerCase() === i18n.get('struct.music.dj', message).toLowerCase()) && !message.member.roles.cache.find(r => r.name.toLowerCase() === i18n.get('struct.music.music', message).toLowerCase()) && permLevel < 3) return message.channel.send(message.__('no_permissions'));

	if (!args[0]) return message.channel.send(message.__('missing_song'));
	if (!args[1]) return message.channel.send(message.__('missing_position'));

	let song = parseInt(args[0]);
	let position = parseInt(args[1]);

	if (!song || !position) return message.channel.send(message.__('invalid_song_or_position'));
	if (song < 2 || position < 2) return message.channel.send(message.__('song_or_position_too_low'));
	if (song === position) return message.channel.send(message.__('song_and_position_same'));
	if (song > message.guild.music.queue.length || position > message.guild.music.queue.length) return message.channel.send(message.__('song_or_position_too_high'));

	move(message.guild.music.queue, song - 1, position - 1);

	message.channel.send(message.__('success', { song: song, pos: position }));
};

exports.config = {
	enabled: true,
	permLevel: 2,
	category: 'music'
};