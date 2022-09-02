let timeouts = {};

module.exports = (client, old, member) => {
	if (timeouts.hasOwnProperty(member.guild.id)) clearTimeout(timeouts[member.guild.id]);

	timeouts[member.guild.id] = setTimeout(() => {
		if (member.guild.me.voice && member.guild.me.voice.connection && (member.guild.me.voice.connection.channel.members.size === 1 || !member.guild.me.voice.connection.channel.members.some(m => m.user.bot === false))) {
			member.guild.music = {};
			member.guild.me.voice.connection.disconnect();
		}

		delete timeouts[member.guild.id];
	}, 1000 * 60)
};