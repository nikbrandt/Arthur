exports.run = (message, a, s, d, permLevel) => {
	if (!message.member.roles.find(r => r.name.toLowerCase() === 'dj') && !message.member.roles.find(r => r.name.toLowerCase() === 'music') && permLevel < 3) return message.channel.send('You do not have permission to stop music. To do so, get mod role or higher, or have the DJ or Music role');
	if (!message.guild.music || !message.guild.music.queue) return message.channel.send('There is no music playing.');

	message.channel.send('Music stopped.');
	message.guild.voiceConnection.disconnect();
	message.guild.music = {};
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['stfu', 'leave', 'gtfo']
};

exports.help = {
	name: 'Stop',
	description: 'Stop all music and leave the channel.',
	usage: 'stop',
	help: 'Stop all currently playing music and leave the channel. Requires "DJ" or "Music" role (or Mod+)',
	category: 'Music'
};