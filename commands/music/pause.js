exports.run = (message, a, s, d, permLevel) => {
	if (!message.member.roles.find(r => r.name.toLowerCase() === 'dj') && !message.member.roles.find(r => r.name.toLowerCase() === 'music') && permLevel < 3) return;
	if (!message.guild.music || !message.guild.music.queue) return message.channel.send('There is no music playing.');

	if (message.guild.music.playing === false) return message.channel.send('The music is already paused. Use `' + d.config.prefix + 'resume` to resume playback.');

	message.guild.voiceConnection.dispatcher.pause();
	message.guild.music.playing = false;
	message.channel.send('Music paused.');
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: []
};

exports.help = {
	name: 'Pause',
	description: 'Pause the currently playing song',
	usage: 'pause',
	help: 'Pause the current song. Requires "DJ" or "Music" role (or Mod+)',
	category: 'Music'
};