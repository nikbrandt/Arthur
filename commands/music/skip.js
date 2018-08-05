const Music = require('../../struct/music');

function skip (message) {
	message.guild.voiceConnection.dispatcher.end();
	message.channel.send(`Song skipped. #Blame${message.member.displayName.replace(/@/g, '@\u200b')}`);
}

exports.run = (message, a, s, d, permLevel) => {
	if (!message.guild.music || !message.guild.music.queue) return message.channel.send('There\'s no music playing, so how exactly would I skip the current song? Are you insane?');

	let canForceSkip = false;
	if (message.member.roles.exists(r => r.name.toLowerCase() === 'dj') || message.member.roles.exists(r => r.name.toLowerCase() === 'music') || permLevel > 3 || message.guild.music.queue[0].person.id === message.author.id) canForceSkip = true;

	if (a[0] === '-f' && canForceSkip) return skip(message);

	if (message.guild.music.queue[0].voteSkips) {
		if (message.guild.music.queue[0].voteSkips.includes(message.author.id)) {
			let index = message.guild.music.queue[0].voteSkips.indexOf(message.author.id);
			message.guild.music.queue[0].voteSkips.splice(index, 1);
			return message.channel.send(`${message.member.displayName}, Vote to skip removed.`);
		}

		message.guild.music.queue[0].voteSkips.push(message.author.id);
	}
	else message.guild.music.queue[0].voteSkips = [ message.author.id ];

	let skipNum = Math.round((message.guild.voiceConnection.channel.members.size - 1) / 2);
	if (message.guild.music.queue[0].voteSkips.length >= skipNum) return skip(message);

	message.channel.send(`${message.member.displayName}, Vote registered. ${skipNum - message.guild.music.queue[0].voteSkips.length} more votes until song is skipped. (${message.guild.music.queue[0].voteSkips.length}/${skipNum})${canForceSkip ? '\n*To force skip, add `-f` on the end of the command*' : ''}`)
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