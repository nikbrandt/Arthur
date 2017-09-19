const Music = require('../../struct/music');

exports.run = (message, a, s, d, permLevel) => {
	if (!message.guild.music || !message.guild.music.queue) return message.channel.send('There\'s no music playing, so how exactly would I skip the current song? Are you insane?');
	if (!message.member.roles.find(r => r.name.toLowerCase() === 'dj') && !message.member.roles.find(r => r.name.toLowerCase() === 'music') && permLevel < 3 && message.guild.music.queue[0].person.id !== message.author.id) return;

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