const Music = require('../../struct/music');

function skip (message) {
	if (message.guild.voiceConnection) message.guild.voiceConnection.dispatcher.end();
	else message.guild.music = {};
	message.channel.send(message.__('skipped', { user: message.member.displayName.replace(/@/g, '@\u200b').replace(/ /g, '') }));
}

exports.run = (message, a, s, d, permLevel) => {
	if (!message.guild.music || !message.guild.music.queue) return message.channel.send(message.__('no_music'));

	let canForceSkip = false;
	if (message.member.roles.exists(r => r.name.toLowerCase() === 'dj') || message.member.roles.exists(r => r.name.toLowerCase() === 'music') || permLevel > 3 || message.guild.music.queue[0].person.id === message.author.id) canForceSkip = true;

	if (a[0] === message.__('force_command_flag') && canForceSkip) return skip(message);

	if (message.guild.music.queue[0].voteSkips) {
		if (message.guild.music.queue[0].voteSkips.includes(message.author.id)) {
			let index = message.guild.music.queue[0].voteSkips.indexOf(message.author.id);
			message.guild.music.queue[0].voteSkips.splice(index, 1);
			return message.channel.send(message.__('vote_skip_removed', { user: message.member.displayName.replace(/@/g, '@\u200b') }));
		}

		message.guild.music.queue[0].voteSkips.push(message.author.id);
	}
	else message.guild.music.queue[0].voteSkips = [ message.author.id ];

	let skipNum = Math.round((message.guild.voiceConnection.channel.members.size - 1) / 2);
	if (message.guild.music.queue[0].voteSkips.length >= skipNum) return skip(message);

	message.channel.send(message.__('vote_skip_registered', { 
		user: message.member.displayName.replace(/@/g, '@\u200b'),
		votes: skipNum - message.guild.music.queue[0].voteSkips.length,
		part: message.guild.music.queue[0].voteSkips.length,
		whole: skipNum,
		forceMessage: canForceSkip ? '\n' + message.__('force_message') : '' 
	}));
};

exports.config = {
	enabled: true,
	permLevel: 2,
	category: 'music'
};
