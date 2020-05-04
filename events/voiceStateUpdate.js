let timeouts = {};

module.exports = (client, old, member) => {
	if (timeouts.hasOwnProperty(member.guild.id)) clearTimeout(timeouts[member.guild.id]);

	timeouts[member.guild.id] = setTimeout(() => {
		if (member.guild.voice && member.guild.voice.connection && (member.guild.voice.connection.channel.members.size === 1 || !member.guild.voice.connection.channel.members.some(m => m.user.bot === false))) {
			member.guild.music = {};
			member.guild.voice.connection.disconnect();
		}

		delete timeouts[member.guild.id];
	}, 1000 * 60)
};