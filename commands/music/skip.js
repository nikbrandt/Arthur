const Music = require('../../struct/music');

exports.run = (message, a, s, d, permLevel) => {
	if (!message.member.roles.find(r => r.name.toLowerCase() === 'dj') && !message.member.roles.find(r => r.name.toLowerCase() === 'music') && permLevel < 3) return message.channel.send('You do not have permission to stop music. To do so, get mod role or higher, or have the DJ or Music role');
	if (!message.guild.music || !message.guild.music.queue) return message.channel.send('There is no music playing.');

	message.guild.voiceConnection.dispatcher.end();
	message.channel.send('Song skipped.');
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: ['next']
};

exports.help = {
	name: 'Skip',
	description: 'Skip the current song.',
	usage: 'skip',
	help: 'Skip the current song. Requires "DJ" or "Music" role (or Mod+)',
	category: 'Music'
};