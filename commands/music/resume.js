exports.run = (message, a, s, d, permLevel) => {
	if (!message.member.roles.find(r => r.name.toLowerCase() === 'dj') && !message.member.roles.find(r => r.name.toLowerCase() === 'music') && permLevel < 3) return;
	if (!message.guild.music || !message.guild.music.queue) return message.channel.send('There is no music playing.');

	if (message.guild.music.playing === true) return message.channel.send('The music is already playing. Use `' + d.config.prefix + 'pause` to pause playback.');

	message.guild.voiceConnection.dispatcher.resume();
	message.guild.music.playing = true;
	message.channel.send('Music resumed.');
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: [ 'go', 'continue' ]
};

exports.help = {
	name: 'Resume',
	description: 'Resume the currently playing song',
	usage: 'resume',
	help: 'Resume the current song. Requires "DJ" or "Music" role (or Mod+)',
	category: 'Music'
};