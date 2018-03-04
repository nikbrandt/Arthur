exports.run = (message, a, s, c, permLevel) => {
	if (!message.guild.music || !message.guild.music.queue) return message.channel.send('Ah yes, I\' make sure to loop the nonexistent music. (play some music thanks)');
	if (!message.member.roles.find(r => r.name.toLowerCase() === 'dj') && !message.member.roles.find(r => r.name.toLowerCase() === 'music' && message.guild.music.queue[0].person.id !== message.author.id) && permLevel < 3) return message.channel.send('hey you don\'t have permission to loop the music, weirdo');

	if (message.guild.music.loop) {
		message.guild.music.loop = false;
		message.channel.send('A\'ight loops off, as you wish.');
	} else {
		message.guild.music.loop = true;
		message.channel.send('Loops on, have fun listening to the same stuff *forever*');
	}
};

exports.config = {
	enabled: true,
	permLevel: 2,
	aliases: []
};

exports.help = {
	name: 'Loop',
	description: 'Loops the current queue of music indefinitely.',
	usage: 'loop',
	help: 'Toggles looping the music queue',
	category: 'Music'
};